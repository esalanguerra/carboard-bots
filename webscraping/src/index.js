require("dotenv").config();

const { pegarXPATH, pegarXPATH3, pegarXPATH2 } = require("./utils/xPath");

const database = require("./database");
const carSchema = require("./database/schemas/carSchema");

const removerEmojis = require("./utils/removerEmojis");
const clickButtons = require("./utils/clickButtons");

const sleep = require("./utils/sleep");
const puppeteer = require("puppeteer");

console.log("Iniciando script...");

var links_antigos = ["Nulo"];
var pagina = 0;
var novos_carro = [];
var navegador = null;

var site_url = "https://www.nettiauto.com/uusimmat";

async function iniciarBot() {
  async function start() {
    async function AbrirNav(url, retries = 10) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

      let browser;
      let page;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          browser = await puppeteer.launch({
            headless: false,
            args: [
              "--ignore-certificate-errors",
              "--no-sandbox",
              "--disable-gpu",
              "--disable-web-security",
            ],
            ignoreHTTPSErrors: true,
            timeout: 120000,
          });

          page = await browser.newPage();

          const client = await page.target().createCDPSession();

          await client.send("Network.enable", {}, { timeout: 12000000 });

          await page.setViewport({ width: 1920, height: 1080 });
          await page.goto(url, {
            waitUntil: ["networkidle2", "load"],
            timeout: 12000000,
          });
          await page.deleteCookie(...(await page.cookies()));

          await page.evaluate(() => {
            document.body.style.transform = "scale(0.25)";
            document.body.style.transformOrigin = "0 0";
            document.body.style.width = "400%";
            document.body.style.overflow = "auto";
          });

          navegador = browser;

          return page;
        } catch (error) {
          console.error(`Erro na tentativa ${attempt}: ${error.message}`);

          if (attempt < retries) {
            console.log(`Tentando novamente em 20 minutos...`);
            await sleep(1200000);
          } else {
            console.log("Todas as tentativas falharam.");
          }
        }
      }
    }

    async function pegarNumeroDeTelefoneEclicar(page) {
      const xpathTelefone = '//*[@id="showUserMobileNumber"]';
      const xpathClicar = '//*[@id="contact_block"]/div/div[2]/div[3]/a';

      try {
        const telefone = await page.evaluate((xpath) => {
          const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          return element ? element.getAttribute("data-phone") : null;
        }, xpathTelefone);

        await page.evaluate((xpath) => {
          const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          if (element) {
            element.click();
          } else {
            console.log("Elemento não encontrado");
          }
        }, xpathClicar);

        return telefone;
      } catch (error) {
        console.error(`Erro ao processar os XPaths:`, error);
        return "Erro ao tentar obter o número de telefone e clicar no elemento";
      }
    }

    async function FecharNav(navegador) {
      await navegador.close();
    }

    while (true) {
      pagina += 1;

      var parametros = {
        posted_by: "seller",
        page: pagina,
      };

      var site = `${site_url}?${new URLSearchParams(parametros).toString()}`;

      var page = await AbrirNav(site);

      let links = await page.evaluate(() => {
        const anchorElements = document.querySelectorAll(
          "#listingData > div:nth-child(1) > div > a"
        );
        return Array.from(anchorElements).map((anchor) => anchor.href);
      });

      await FecharNav(navegador);

      if (links === links_antigos[0]) {
        console.log("Nenhum novo link encontrado, reiniciando a página...");

        pagina = 0;
        break;
      } else {
        links_antigos = [];
      }

      links_antigos.push(links);

      for (let link of links) {
        var page = await AbrirNav(link);

        let nome_dono = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[2]/div/div[1]/div[1]/div[1]/div[2]/div',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[2]/div/div[1]/div[1]/div[1]/div[2]/div',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[2]/div/div[1]/div[1]/div[1]/div[2]/div',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[2]/div/div[1]/div[1]/div[1]/div[2]/div',
        ]);

        let nome_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[2]/div/h1',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[2]/div/h1',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[2]/div/h1',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[2]/div/h1',
        ]);

        let quilometragem_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[2]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[2]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[2]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[2]/div/div[2]',
        ]);

        let motor_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[3]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[3]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[3]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[3]/div/div[2]',
        ]);

        let cambio_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[5]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[5]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[5]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[5]/div/div[2]',
        ]);

        let proprietarios_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[20]/div/div[1]/div[2]/div[1]/div[4]/div/div[3]/div/div[7]/div[2]',
          '//*[@id="slideEffect"]/div[19]/div/div[1]/div[2]/div[1]/div[4]/div/div[3]/div/div[7]/div[2]',
          '//*[@id="slideEffect"]/div[21]/div/div[1]/div[2]/div[1]/div[4]/div/div[3]/div/div[7]/div[2]',
          '//*[@id="slideEffect"]/div[22]/div/div[1]/div[2]/div[1]/div[4]/div/div[3]/div/div[7]/div[2]',
        ]);

        let condic_car = await page.evaluate(() => {
          const element = document.querySelector(
            ".details-page-header__road-worthy"
          );
          return element ? element.innerText : null;
        });

        let preco_carro = await page.evaluate(() => {
          const element = document.querySelector(
            ".details-page-header__item-price-main"
          );
          return element ? element.innerText : null;
        });

        let status_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
        ]);

        let ano_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[4]/div/div[2]',
        ]);

        let inspecionado_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[7]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[7]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[7]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[7]/div/div[2]',
        ]);

        let sistema_de_trans_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[6]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[6]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[6]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[6]/div/div[2]',
        ]);

        let id_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[2]/div/div[5]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[2]/div/div[5]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[2]/div/div[5]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[2]/div/div[5]',
        ]);

        let placa_carro = await pegarXPATH(page, [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[1]/div/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[1]/div/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[1]/div/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]/div/div[2]/div[1]/div/div[2]',
        ]);

        await clickButtons(page);

        let especificacoes_carro = await pegarXPATH3(page, "Tekniset tiedot", [
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[1]',
        ]);

        let seguranca_carro = await pegarXPATH2(page, "Turvallisuus", [
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[1]',
        ]);

        let interior_carro = await pegarXPATH2(
          page,
          "Sisätilat ja mukavuudet",
          [
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[12]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[11]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[10]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[9]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[8]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[7]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[6]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[5]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[4]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[2]',
            '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[1]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[12]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[11]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[10]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[9]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[8]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[7]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[6]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[5]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[4]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[2]',
            '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[1]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[12]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[11]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[10]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[9]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[8]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[7]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[6]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[5]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[4]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[2]',
            '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[1]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[12]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[11]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[10]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[9]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[8]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[7]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[6]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[5]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[4]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[2]',
            '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[1]',
          ]
        );

        let eletronica_carro = await pegarXPATH2(page, "Elektroniikka", [
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[1]',
        ]);

        let outros_carro = await pegarXPATH2(page, "Muut", [
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[1]',
        ]);

        let infor_adicionais_carro = await pegarXPATH2(page, "Lisätiedot", [
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[22]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[21]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[20]/div[1]/div[1]/div[4]/div[1]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[12]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[11]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[10]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[9]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[8]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[7]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[6]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[5]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[4]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[3]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[2]',
          '//*[@id="slideEffect"]/div[19]/div[1]/div[1]/div[4]/div[1]',
        ]);

        let imagem_carro = [];

        try {
          imagem_carro = await page.evaluate(() => {
            const imagens = [];

            const elementos = document.querySelectorAll(
              ".swiper-slide .swiper-large-slider__image_main"
            );

            elementos.forEach((elemento) => {
              imagens.push(elemento.getAttribute("src"));
            });

            return imagens;
          });
        } catch (error) {
          imagem_carro = [];
        }

        const telefone = await pegarNumeroDeTelefoneEclicar(page);

        const carNoEmojis = {
          nome_dono: removerEmojis(nome_dono),
          nome_carro: removerEmojis(nome_carro),
          condic_car: removerEmojis(condic_car),
          preco_carro: removerEmojis(preco_carro),
          status_carro: removerEmojis(status_carro),
          ano_carro: removerEmojis(ano_carro),
          especificacoes_carro: removerEmojis(especificacoes_carro),
          quilometragem_carro: removerEmojis(quilometragem_carro),
          motor_carro: removerEmojis(motor_carro),
          cambio_carro: removerEmojis(cambio_carro),
          proprietarios_carro: removerEmojis(proprietarios_carro),
          inspecionado_carro: removerEmojis(inspecionado_carro),
          sistema_de_trans_carro: removerEmojis(sistema_de_trans_carro),
          id_carro: removerEmojis(id_carro),
          placas_carro: removerEmojis(placa_carro),
          seguranca_carro: removerEmojis(seguranca_carro),
          interior_carro: removerEmojis(interior_carro),
          eletronica_carro: removerEmojis(eletronica_carro),
          outros_carro: removerEmojis(outros_carro),
          infor_adicionais_carro: removerEmojis(infor_adicionais_carro),
        };

        carNoEmojis.nome_dono = carNoEmojis.nome_dono
          ? carNoEmojis.nome_dono
          : undefined;
        carNoEmojis.nome_carro = carNoEmojis.nome_carro
          ? carNoEmojis.nome_carro
          : undefined;
        carNoEmojis.condic_car = carNoEmojis.condic_car
          ? carNoEmojis.condic_car
          : undefined;
        carNoEmojis.preco_carro = carNoEmojis.preco_carro
          ? carNoEmojis.preco_carro
          : undefined;
        carNoEmojis.status_carro = carNoEmojis.status_carro
          ? carNoEmojis.status_carro
          : undefined;
        carNoEmojis.ano_carro = carNoEmojis.ano_carro
          ? carNoEmojis.ano_carro
          : undefined;
        carNoEmojis.especificacoes_carro = carNoEmojis.especificacoes_carro
          ? carNoEmojis.especificacoes_carro
          : undefined;
        carNoEmojis.quilometragem_carro = carNoEmojis.quilometragem_carro
          ? carNoEmojis.quilometragem_carro
          : undefined;
        carNoEmojis.motor_carro = carNoEmojis.motor_carro
          ? carNoEmojis.motor_carro
          : undefined;
        carNoEmojis.cambio_carro = carNoEmojis.cambio_carro
          ? carNoEmojis.cambio_carro
          : undefined;
        carNoEmojis.proprietarios_carro = carNoEmojis.proprietarios_carro
          ? carNoEmojis.proprietarios_carro
          : undefined;
        carNoEmojis.inspecionado_carro = carNoEmojis.inspecionado_carro
          ? carNoEmojis.inspecionado_carro
          : undefined;
        carNoEmojis.sistema_de_trans_carro = carNoEmojis.sistema_de_trans_carro
          ? carNoEmojis.sistema_de_trans_carro
          : undefined;
        carNoEmojis.id_carro = carNoEmojis.id_carro
          ? carNoEmojis.id_carro
          : undefined;
        carNoEmojis.placas_carro = carNoEmojis.placas_carro
          ? carNoEmojis.placas_carro
          : undefined;
        carNoEmojis.seguranca_carro = carNoEmojis.seguranca_carro
          ? carNoEmojis.seguranca_carro
          : undefined;
        carNoEmojis.interior_carro = carNoEmojis.interior_carro
          ? carNoEmojis.interior_carro
          : undefined;
        carNoEmojis.eletronica_carro = carNoEmojis.eletronica_carro
          ? carNoEmojis.eletronica_carro
          : undefined;
        carNoEmojis.outros_carro = carNoEmojis.outros_carro
          ? carNoEmojis.outros_carro
          : undefined;
        carNoEmojis.infor_adicionais_carro = carNoEmojis.infor_adicionais_carro
          ? carNoEmojis.infor_adicionais_carro
          : undefined;

        if (carNoEmojis.seguranca_carro) {
          carNoEmojis.seguranca_carro = carNoEmojis.seguranca_carro.replace(
            "Turvallisuus ",
            ""
          );
          carNoEmojis.seguranca_carro = carNoEmojis.seguranca_carro.replace(
            "Turvallisuus",
            ""
          );
        }

        if (carNoEmojis.preco_carro) {
          carNoEmojis.preco_carro = preco_carro.replace("€", "");
          carNoEmojis.preco_carro = preco_carro.replace(" ", "");
          carNoEmojis.preco_carro = parseFloat(
            carNoEmojis.preco_carro.replace(",", ".")
          );
        }

        if (carNoEmojis.ano_carro) {
          carNoEmojis.ano_carro = carNoEmojis.ano_carro.slice(0, 4);
          carNoEmojis.ano_carro = parseInt(carNoEmojis.ano_carro);
        }

        if (carNoEmojis.infor_adicionais_carro) {
          carNoEmojis.infor_adicionais_carro =
            carNoEmojis.infor_adicionais_carro.replace("Lisätiedot ", "");
          carNoEmojis.infor_adicionais_carro =
            carNoEmojis.infor_adicionais_carro.replace("Lisätiedot", "");
        }

        if (carNoEmojis.eletronica_carro) {
          carNoEmojis.eletronica_carro = carNoEmojis.eletronica_carro.replace(
            "Elektroniikka ",
            ""
          );
          carNoEmojis.eletronica_carro = carNoEmojis.eletronica_carro.replace(
            "Elektroniikka",
            ""
          );
        }

        if (carNoEmojis.interior_carro) {
          carNoEmojis.interior_carro = carNoEmojis.interior_carro.replace(
            "Sisätilat ja mukavuudet ",
            ""
          );
          carNoEmojis.interior_carro = carNoEmojis.interior_carro.replace(
            "Sisätilat ja mukavuudet ",
            ""
          );
        }

        let espercifications = {
          power: undefined,
          topSpeed: undefined,
          acceleration: undefined,
          numberOfPeople: undefined,
          numberOfDoors: undefined,
          meterReading: undefined,
          enginePower: undefined,
          engineVolume: undefined,
          driveType: undefined,
          gearbox: undefined,
          torque: undefined,
          co2Emissions: undefined,
          fuelConsumption: undefined,
          weight: undefined,
          ownWeight: undefined,
          totalWeight: undefined,
          towingWeight: undefined,
          towingWeightNonBraked: undefined,
        };

        if (especificacoes_carro.includes("Teho,,, ")) {
          espercifications.power = especificacoes_carro
            .split("Teho,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Huippunopeus,,, ")) {
          espercifications.topSpeed = especificacoes_carro
            .split("Huippunopeus,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Kiihtyvyys (0-100),,, ")) {
          espercifications.acceleration = especificacoes_carro
            .split("Kiihtyvyys (0-100),,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Henkilömäärä,,, ")) {
          espercifications.numberOfPeople = especificacoes_carro
            .split("Henkilömäärä,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Ovien lkm,,, ")) {
          espercifications.numberOfDoors = especificacoes_carro
            .split("Ovien lkm,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Mittarilukema,,, ")) {
          espercifications.meterReading = especificacoes_carro
            .split("Mittarilukema,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Käyttövoima,,, ")) {
          espercifications.enginePower = especificacoes_carro
            .split("Käyttövoima,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Moottorin tilavuus,,, ")) {
          espercifications.engineVolume = especificacoes_carro
            .split("Moottorin tilavuus,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Vetotapa,,, ")) {
          espercifications.espercificationsdriveType = especificacoes_carro
            .split("Vetotapa,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Vaihteisto,,, ")) {
          espercifications.gearbox = especificacoes_carro
            .split("Vaihteisto,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Vääntö,,, ")) {
          espercifications.torque = especificacoes_carro
            .split("Vääntö,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("CO2 päästöt,,, ")) {
          espercifications.co2Emissions = especificacoes_carro
            .split("CO2 päästöt,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Polttoaineen kulutus,,, ")) {
          espercifications.fuelConsumption = especificacoes_carro
            .split("Polttoaineen kulutus,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Massa,,, ")) {
          espercifications.weight = especificacoes_carro
            .split("Massa,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Omamassa,,, ")) {
          espercifications.ownWeight = especificacoes_carro
            .split("Omamassa,,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Vetomassa (jarrullinen),,, ")) {
          espercifications.towingWeight = especificacoes_carro
            .split("Vetomassa (jarrullinen),,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Vetomassa (ei jarruja),,, ")) {
          espercifications.towingWeightNonBraked = especificacoes_carro
            .split("Vetomassa (ei jarruja),,, ")[1]
            .split(",")[0];
        }

        if (especificacoes_carro.includes("Kokonaismassa,,, ")) {
          espercifications.totalWeight = especificacoes_carro
            .split("Kokonaismassa,,, ")[1]
            .split(",")[0];
        }

        if (espercifications.numberOfDoors) {
          espercifications.numberOfDoors = parseInt(
            espercifications.numberOfDoors
          );
        }

        if (espercifications.numberOfPeople) {
          espercifications.numberOfPeople = parseInt(
            espercifications.numberOfPeople
          );
        }

        if (espercifications.ownWeight) {
          espercifications.ownWeight = espercifications.ownWeight.replace(
            "kg",
            ""
          );
          espercifications.ownWeight = espercifications.ownWeight.replace(
            " ",
            ""
          );
          espercifications.ownWeight = parseFloat(espercifications.ownWeight);
        }

        if (espercifications.weight) {
          espercifications.weight = espercifications.weight.replace("kg", "");
          espercifications.weight = espercifications.weight.replace(" ", "");
          espercifications.weight = parseFloat(espercifications.weight);
        }

        if (espercifications.totalWeight) {
          espercifications.totalWeight = espercifications.totalWeight.replace(
            "kg",
            ""
          );
          espercifications.totalWeight = espercifications.totalWeight.replace(
            " ",
            ""
          );
          espercifications.totalWeight = parseFloat(
            espercifications.totalWeight
          );
        }

        if (espercifications.towingWeight) {
          espercifications.towingWeight = espercifications.towingWeight.replace(
            "kg",
            ""
          );
          espercifications.towingWeight = espercifications.towingWeight.replace(
            " ",
            ""
          );
          espercifications.towingWeight = parseFloat(
            espercifications.towingWeight
          );
        }

        if (espercifications.towingWeightNonBraked) {
          espercifications.towingWeightNonBraked =
            espercifications.towingWeightNonBraked.replace("kg", "");
          espercifications.towingWeightNonBraked =
            espercifications.towingWeightNonBraked.replace(" ", "");
          espercifications.towingWeightNonBraked = parseFloat(
            espercifications.towingWeightNonBraked
          );
        }

        if (carNoEmojis.quilometragem_carro) {
          carNoEmojis.quilometragem_carro =
            carNoEmojis.quilometragem_carro.replace("km", "");
          carNoEmojis.quilometragem_carro =
            carNoEmojis.quilometragem_carro.replace(" ", "");
          carNoEmojis.quilometragem_carro = parseInt(
            carNoEmojis.quilometragem_carro
          );
        }

        if (carNoEmojis.id_carro) {
          carNoEmojis.id_carro = carNoEmojis.id_carro.replace("ID ", "");
          carNoEmojis.id_carro = parseInt(carNoEmojis.id_carro);
        }

        const car = {
          seller: carNoEmojis.nome_dono,
          name: carNoEmojis.nome_carro,
          price: carNoEmojis.preco_carro,
          condition: carNoEmojis.condic_car,
          status: carNoEmojis.status_carro,
          year: carNoEmojis.ano_carro,
          espercifications: espercifications,
          mileage: carNoEmojis.quilometragem_carro,
          engine: carNoEmojis.motor_carro,
          gearbox: carNoEmojis.cambio_carro,
          owners: carNoEmojis.proprietarios_carro,
          inspection: carNoEmojis.inspecionado_carro,
          transmissionSystem: carNoEmojis.sistema_de_trans_carro,
          idCar: carNoEmojis.id_carro,
          plate: carNoEmojis.placas_carro,
          safety: carNoEmojis.seguranca_carro,
          interior: carNoEmojis.interior_carro,
          electronics: carNoEmojis.eletronica_carro,
          others: carNoEmojis.outros_carro,
          additionalInformation: carNoEmojis.infor_adicionais_carro,
          images: imagem_carro,
          phone: telefone,
          link: link,
        };

        if (!page.isClosed()) {
          await FecharNav(navegador);
        }

        if (await carSchema.exists({ idCar: car.idCar })) {
          try {
            await carSchema.updateOne({ idCar: car.idCar }, car);

            console.log(`Carro ${car.idCar} atualizado com sucesso!`);
          } catch (error) {
            try {
              await carSchema.deleteOne({ idCar: car.idCar });

              await carSchema.create(car);

              console.log(`Carro ${car.idCar} atualizado com sucesso!`, car);
            } catch (error) {
              console.log(`Erro ao atualizar o carro ${car.idCar}`, error);
            }
          }
        } else {
          try {
            await carSchema.create(car);

            console.log(`Carro ${car.idCar} criado com sucesso!`);
          } catch (error) {
            console.log(`Erro ao criar o carro ${car.idCar}`, error);
          }
        }
      }
    }
  }

  while (true) {
    await start();
    console.log("Esperando 2 horas antes da próxima execução...");
    await sleep(7200000);
  }
}

async function enviarDados(car) {
  console.log("Enviando dados para o banco de dados...");
}

const init = async () => {
  await database();

  await iniciarBot();

  setInterval(async () => {
    const car = [];
    await enviarDados(car);
  }, 3600000);
};

init();
