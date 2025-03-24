// const button = document.querySelector('.button-enviar');
// const userStoryName = document.querySelector('input');
// const description = document.querySelector('textarea');
// const tituloRenderizada = document.querySelector('.titulo-renderizada');
// const respostaRenderizada = document.querySelector('.resposta-renderizada');
const buttonCopyCommits = document.querySelector(".button-copy-commits");

// button.addEventListener('click', processRequest);
// tituloRenderizada.addEventListener('click', copyTitle)
// respostaRenderizada.addEventListener('click', copyDescription)
buttonCopyCommits.addEventListener("click", getCommits);
var markdown = "";
function processRequest() {
    button.disabled = true;
    button.textContent = "Carregando...";
    fetch("https://cloudflare-works.andre-rodrigues0018.workers.dev/gemini/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userStoryName: userStoryName.value,
            description: description.value,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.markdown && data.title) {
                markdown = data.markdown;
                const htmlContent = markdownToHtml(markdown);
                respostaRenderizada.innerHTML = htmlContent;
                tituloRenderizada.innerHTML = data.title;
                button.disabled = false;
                button.textContent = "Gerar Descrição";
                alert("Gerada descrição do PR com sucesso!");
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
    var textoParaCopiar = markdown;
    if (element == "titulo") {
        textoParaCopiar = tituloRenderizada.textContent;
    }
    const tempElem = document.createElement("textarea");
    tempElem.textContent = textoParaCopiar;
    document.body.appendChild(tempElem);
    tempElem.select();
    document.execCommand("copy");
    document.body.removeChild(tempElem);
    alert("Texto copiado com sucesso!");
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
        const commitsTextarea = document.getElementById("commits");
        const textContent = event.data.data.join("\n");
        commitsTextarea.value = textContent;
    }
});
