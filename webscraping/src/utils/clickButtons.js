const sleep = require("./sleep");

async function clickButtons(page) {
  await page.evaluate(() => {
    const elements = document.querySelectorAll("#readMoreCaption");
    elements.forEach((element) => {
      try {
        if (element.textContent.includes("Lue lisää")) {
          element.click();
        }
      } catch (error) {
        console.warn("Erro ao clicar em elemento:", error);
      }
    });
  });

  await sleep(2000);
}

module.exports = clickButtons;
