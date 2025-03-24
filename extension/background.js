chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTexts") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractTextsAndBranch
                }, (results) => {
                    sendResponse(results[0]?.result || { commits: [], branch: null });
                });
            }
        });

        return true;
    }
});

function extractTextsAndBranch() {
    const elements = document.querySelectorAll("a.Link--primary.text-bold.markdown-title");
    const commits = Array.from(elements).map(el => el.textContent.trim());
    
    const url = window.location.href;
    let branch = null;
    
    if (url.includes('/compare/')) {
        const comparePattern1 = /\/compare\/[^.]+\.{3}([^?]+)/;
        const comparePattern2 = /\/compare\/([^?]+)/;
        
        const match1 = url.match(comparePattern1);
        const match2 = url.match(comparePattern2);
        
        if (match1) {
            branch = match1[1];
        } else if (match2) {
            branch = match2[1];
        }
    }

    return {
        commits: commits,
        branch: branch
    };
}