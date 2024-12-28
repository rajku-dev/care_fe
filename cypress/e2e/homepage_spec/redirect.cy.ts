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
    cy.awaitUrl("/login", true);

    loginPage.verifyGitHubLinkPresence();
    loginPage.clickGitHubLink();

    cy.origin("https://github.com", () => {
      cy.url().should("include", "github.com/ohcnetwork");
      cy.get(".heading-element").should("exist");
      cy.get(".heading-element").should(
        "contain.text",
        "Reimagining Healthcare Delivery",
      );
    });
  });

  it("Check if 'Third Party Software License' link redirects correctly", () => {
    cy.awaitUrl("/login", true);

    loginPage.verifyLicenseLinkPresence();
    loginPage.clickThirdPartyLicenseLink();

    cy.url().should("include", "/licenses");

    cy.contains(
      "This page shows what third-party software is used in Care, including the respective licenses and versions.",
    ).should("exist");
  });
});
