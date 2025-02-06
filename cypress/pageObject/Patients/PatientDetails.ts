export class PatientDetails {
  clickUsersTab() {
    cy.verifyAndClickElement('[data-cy="tab-users"]', "Users");
    return this;
  }

  clickAssignUserButton() {
    cy.verifyAndClickElement('[data-cy="assign-user-button"]', "Assign User");
    return this;
  }

  selectUserToAssign(username: string) {
    cy.typeAndSelectOption(
      '[data-cy="patient-user-selector-container"]',
      username,
      false,
    );
    return this;
  }

  selectUserRole(role: string) {
    cy.clickAndSelectOption('[data-cy="patient-user-role-select"]', role);
    return this;
  }

  confirmUserAssignment() {
    cy.verifyAndClickElement(
      '[data-cy="patient-user-assign-button"]',
      "Assign to Patient",
    );
    return this;
  }

  verifyUserAssignmentSuccess() {
    cy.verifyNotification("User added to patient successfully");
    return this;
  }

  clickRemoveUserButton() {
    cy.get('[data-cy="patient-user-remove-button"]').first().click();
    return this;
  }

  confirmUserRemoval() {
    cy.verifyAndClickElement(
      '[data-cy="patient-user-remove-confirm-button"]',
      "Remove",
    );
    return this;
  }

  verifyUserContent(expectedTexts: string[]) {
    cy.verifyContentPresence('[data-cy="patient-users"]', expectedTexts);
    return this;
  }

  verifyUserRemovalSuccess() {
    cy.verifyNotification("User removed successfully");
    return this;
  }
}
