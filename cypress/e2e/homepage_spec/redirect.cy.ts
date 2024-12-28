import LoginPage from "../../pageobject/Login/LoginPage";

describe("redirect", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    cy.log("Logging in the user devdistrictadmin");
  });

  it("Check if login redirects to the right url", () => {
    cy.awaitUrl("/resource/board", true);
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
    cy.url().should("include", "/resource/board");
  });

  it("Check if the redirect param works", () => {
    const baseUrl = Cypress.config("baseUrl");
    cy.awaitUrl(`login?redirect=${baseUrl}/resource/board`, true);
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
    cy.url().should("include", "/resource/board");
  });

  it("Check to ensure that redirect is the same origin", () => {
    cy.awaitUrl("login?redirect=https://google.com", true);
    loginPage.loginManuallyAsDistrictAdmin();
    loginPage.ensureLoggedIn();
    cy.url().should("include", "/facility");
  });

  it("Check if 'Contribute on GitHub' link redirects correctly", () => {
    cy.awaitUrl("/", true);

    loginPage.verifyGitHubLinkPresence();
    loginPage.clickGitHubLink();

    cy.origin("https://github.com", () => {
      cy.url().should("include", "github.com/ohcnetwork");
      cy.get(".heading-element")
        .should("exist")
        .and("contain.text", "Reimagining Healthcare Delivery");
    });
  });

  it("Check if 'Third Party Software License' link redirects correctly", () => {
    cy.awaitUrl("/", true);

    loginPage.verifyLicenseLinkPresence();
    loginPage.clickThirdPartyLicenseLink();

    cy.url().should("include", "/licenses");

    cy.contains(
      "This page shows what third-party software is used in Care, including the respective licenses and versions.",
    ).should("exist");
  });

  it("Should switch languages and verify the Login button text", () => {
    cy.awaitUrl("/", true);

    const loginButtonMapping: Record<string, string> = {
      தமிழ்: "உள்நுழைய",
      മലയാളം: "ലോഗിൻ ചെയ്യുക/അകത്തു പ്രവേശിക്കുക",
      मराठी: "लॉगिन",
      ಕನ್ನಡ: "ಲಾಗಿನ್",
      हिन्दी: "लॉग इन करें",
    };

    Object.entries(loginButtonMapping).forEach(([language, loginText]) => {
      loginPage.switchLanguageAndVerifySubmitText(language, loginText);
    });
  });

  it("Should display sidebar items in the selected language", () => {
    cy.awaitUrl("/", true);

    loginPage.switchLanguage("हिन्दी");

    cy.get("input[id='username']").click().type("devdistrictadmin");
    cy.get("input[id='password']").click().type("Coronasafe@123");

    cy.verifyAndClickElement("#login-button", "लॉग इन करें");

    const sidebarItems: Record<string, string> = {
      "facilities-link": "सुविधाएँ",
      "patients-link": "मरीजों",
      "assets-link": "संपत्ति",
      "shifting-link": "स्थानांतरण",
      "resource-link": "संसाधन",
      "users-link": "उपयोगकर्ताओं",
      "notice-board-link": "सूचना पट्ट",
    };

    Object.keys(sidebarItems).forEach((id) => {
      cy.get(`#${id} span`)
        .filter(":visible")
        .invoke("text")
        .should("equal", sidebarItems[id]);
    });
  });
});
