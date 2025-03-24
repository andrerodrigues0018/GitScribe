

const buttonCopyCommits = document.querySelector(".button-copy-commits");
const branchTextarea = document.getElementById("branch");
const commitsTextarea = document.getElementById("commits");

const generateButton = document.querySelector('.generate-button');
const generateButtonText = document.querySelector('.generate-button p');
const generateButtonIcon = document.querySelector('.generate-button img');

const commitsTitle = document.querySelector('.commits-title');
const commitsDescription = document.querySelector('.commits-description');

const boxOutputTitle = document.querySelector('.output-title');
const boxOutputDescription = document.querySelector('.output-description');

generateButton.addEventListener('click', processRequest);
buttonCopyCommits.addEventListener("click", getCommits);
boxOutputTitle.addEventListener('click', copyTitle)
boxOutputDescription.addEventListener('click', copyDescription)
var markdown = "";
function processRequest() {
    generateButton.disabled = true;
    generateButtonText.innerHTML = "Thinking";
    fetch("https://cloudflare-works.andre-rodrigues0018.workers.dev/gemini/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userStoryName: branchTextarea.value,
            description: commitsTextarea.value,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.markdown && data.title) {
                markdown = data.markdown;
                const htmlContent = markdownToHtml(markdown);
                commitsDescription.innerHTML = htmlContent;
                commitsTitle.innerHTML = data.title;
                generateButton.disabled = false;
                generateButtonText.innerHTML = "Generate";
            } else {
                processRequest();
            }
        })
        .catch((error) => {
            console.error("Erro ao processar reqyest:", error);
        });
}

function markdownToHtml(markdownText) {
    const boldRegex = /\*\*(.*?)\*\*/;
    const italicRegex = /\_(.*?)\_/;
    const codeRegex = /`(.*?)`/;
    const blockquoteRegex = /^> (.*)$/gm;
    const listRegex = /^-\s+(.*)$/;
    const linkInlineRegex = /\[(.*?)\]\((.*?)\)/;
    const linkReferenceRegex = /\[(.*?)\]\[(.*?)\]/g;
    const headingRegex = /^(#{1,6})\s+(.*)$/;
    const plainTextRegex = /^([^#*-+]+)$/;

    let html = "";
    const lines = markdownText.split("\n");
    for (const line of lines) {
        let processedLine = line;
        processedLine = processedLine.replace(listRegex, "<li>$1</li>");

        const headingMatch = headingRegex.exec(line);
        if (headingMatch) {
            const level = headingMatch[1].length;
            processedLine = `<h${level}>${headingMatch[2]}</h${level}>`;
            console.log("Processed Heading:", processedLine);
        }
        processedLine = processedLine.replace(boldRegex, "<strong>$1</strong>");
        processedLine = processedLine.replace(italicRegex, "<em>$1</em>");
        processedLine = processedLine.replace(codeRegex, "<code>$1</code>");
        processedLine = processedLine.replace(
            blockquoteRegex,
            function (match, content) {
                return `<blockquote><p>${content.replace(
                    /\n/g,
                    "</p><p>"
                )}</p></blockquote>`;
            }
        );

        processedLine = processedLine.replace(
            linkInlineRegex,
            function (match, text, url) {
                return `<a href="${url}">${text}</a>`;
            }
        );
        const referenceLinks = {};
        markdownText.split("\n").forEach((line) => {
            const referenceMatch = line.match(/^(\[(.*?)\]):\s+(.*)$/);
            if (referenceMatch) {
                referenceLinks[referenceMatch[2]] = referenceMatch[3];
            }
        });

        processedLine = processedLine.replace(
            linkReferenceRegex,
            function (match, text, reference) {
                if (referenceLinks[reference]) {
                    return `<a href="${referenceLinks[reference]}">${text}</a>`;
                } else {
                    console.warn(`Broken reference link: ${reference}`);
                    return match;
                }
            }
        );

        html += processedLine + "\n";
    }

    return html;
}

function copyText(element) {
    var textoParaCopiar = commitsDescription.textContent;
    if (element == "titulo") {
        textoParaCopiar = commitsTitle.textContent;
    }
    const tempElem = document.createElement("textarea");
    tempElem.textContent = textoParaCopiar;
    document.body.appendChild(tempElem);
    tempElem.select();
    document.execCommand("copy");
    document.body.removeChild(tempElem);
}

function copyTitle() {
    copyText("titulo");
}

function copyDescription() {
    copyText("description");
}

function getCommits() {
    window.parent.postMessage({ action: "requestTexts" }, "*");
}

window.addEventListener("message", (event) => {
    if (event.data.action === "updateTexts") {
        const commitsContent = event.data.data.commits.join("\n");
        const branchContent = event.data.data.branch;
        commitsTextarea.value = commitsContent;
        branchTextarea.value = branchContent;
    }
});
