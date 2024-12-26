export class DoctorConnect {
  clickDoctorConnectButton() {
    cy.get("#doctor-connect-button").scrollIntoView();
    cy.get("#doctor-connect-button").click();
  }

  CopyFunctionTrigger() {
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, "writeText").as("clipboardStub");
    });
  }

  verifyCopiedContent() {
    cy.get("@clipboardStub").should("be.calledWithMatch", /^\+91\d{10}$/);
  }

  verifyIconVisible(selector: string) {
    cy.get(selector).should("be.visible");
  }

  clickCopyPhoneNumber(element: string, text: string) {
    cy.get(element)
      .contains(text) // Find the element containing "dev doctor"
      .parent() // Move up to the parent element (if necessary)
      .get("#copy-alt-phone-button") // Find the #copy-alt-phone-button within that context
      .click();
  }

  clickUsersSortBy(text: string) {
    cy.get("#doctor-connect-filter-tabs").contains(text).click();
  }
}
