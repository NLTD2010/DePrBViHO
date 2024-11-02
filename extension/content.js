let commentQueue = []; // Hàng đợi cho các bình luận mới
function cleanText(text) {
  // Loại bỏ emoji bằng cách chỉ giữ lại ký tự không thuộc phạm vi emoji
  const noEmoji = text.replace(/([\u{1F600}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}])/gu, "");

  // Loại bỏ khoảng trắng thừa và xuống dòng
  const cleanedText = noEmoji.replace(/\s+/g, " ").trim();

  return cleanedText;
}

async function checkComment(text) {
  const cleanedText = cleanText(text);
  if (cleanedText.length === 0) return "0"; // Bỏ qua chuỗi rỗng

  const body = JSON.stringify({ "text": cleanedText });

  try {
    const response = await fetch("http://localhost:49385/predict", {
      method: "POST",
      mode: 'cors',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      },
      body: body
    });

    if (!response.ok) {
      console.error("API Error:", response.statusText);
      return "0";
    }

    const data = await response.json();
    console.log("Label nhận được từ API:", data.label); // Log kết quả để kiểm tra
    return data.label;
  } catch (error) {
    console.error("Request failed:", error);
    return "0";
  }
}


function getTextContent(element) {
  let text = "";
  element.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent + " ";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      text += getTextContent(node);
    }
  });
  return text.trim();
}

function processCommentQueue() {
  if (commentQueue.length === 0) return;

  // Xử lý từng bình luận trong hàng đợi
  commentQueue.forEach(async (comment) => {
    if (comment.getAttribute("data-processed")) return;

    const textElement = comment.querySelector("#content-text");
    const text = getTextContent(textElement);
    const label = await checkComment(text);

    if (label === "1") {
      const originalText = textElement.innerText;
      textElement.style.filter = "blur(5px)";
      textElement.innerText = "Nội dung này chứa ngôn ngữ thô tục!";

      comment.addEventListener("click", () => {
        if (textElement.innerText === "Nội dung này chứa ngôn ngữ thô tục!") {
          textElement.innerText = originalText;
          textElement.style.filter = "none";
        }
      });
    } else if (label === "2") {
      comment.remove();
    }

    comment.setAttribute("data-processed", "true");
  });

  // Xóa hàng đợi sau khi đã xử lý xong
  commentQueue = [];
}

// Theo dõi thay đổi trên trang với MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches("ytd-comment-view-model")) {
        // Thêm bình luận mới vào hàng đợi
        if (!node.getAttribute("data-processed")) {
          commentQueue.push(node);
        }
      }
    });
  });
});

// Kiểm soát thời gian xử lý hàng đợi
setInterval(processCommentQueue, 500); // Điều chỉnh thời gian tùy theo nhu cầu

observer.observe(document.body, { childList: true, subtree: true });
