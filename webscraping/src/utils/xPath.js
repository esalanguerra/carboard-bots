async function pegarXPATH(page, xpaths) {
  for (const xpath of xpaths) {
    if (!xpath) continue;

    try {
      const texto = await page.evaluate((xpath) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return element ? element.textContent.trim() : null;
      }, xpath);

      if (texto) return texto.replace(/\s\s+/g, " ").replace(/,{2,}/g, ",");
    } catch (error) {
      console.error(`Erro ao pegar XPATH: ${error}`);
    }
  }
  return null;
}

async function pegarXPATH2(page, palavra, xpaths) {
  for (const xpath of xpaths) {
    if (!xpath || typeof xpath !== "string" || xpath.trim() === "") {
      continue;
    }

    try {
      const elementoEspecificacoes = await page.evaluate((xpath) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return element ? element.innerHTML : null;
      }, xpath);

      if (elementoEspecificacoes && elementoEspecificacoes.includes(palavra)) {
        const textoLimpo = elementoEspecificacoes
          .replace(/<p>/g, "\n")
          .replace(/<\/p>/g, "")
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/(\n{2,})/g, "\n")
          .replace(/\s\s+/g, " ")
          .replace(/,{2,}/g, ",")
          .replace(/ ,/g, ",")
          .replace(/Lue lisää/g, "");

        return textoLimpo.trim();
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

async function pegarXPATH3(page, palavra, xpaths) {
  for (const xpath of xpaths) {
    if (!xpath || typeof xpath !== "string" || xpath.trim() === "") {
      continue;
    }

    try {
      const elementoEspecificacoes = await page.evaluate((xpath) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return element ? element.textContent : null;
      }, xpath);

      if (elementoEspecificacoes && elementoEspecificacoes.includes(palavra)) {
        const textoLimpo = elementoEspecificacoes
          .replace(/\n/g, ", ")
          .replace(/\s\s+/g, " ")
          .replace(/,{2,}/g, ",")
          .replace(/ ,/g, ",")
          .replace(/Lue lisää/g, "");

        return textoLimpo;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

module.exports = {
  pegarXPATH,
  pegarXPATH3,
  pegarXPATH2,
};
