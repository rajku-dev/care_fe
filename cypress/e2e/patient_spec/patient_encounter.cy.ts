import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();

describe("Patient Encounter Questionnaire", () => {
  beforeEach(() => {
    cy.loginByApi("devnurse");
    cy.visit("/");
  });

  it("Create a new ABG questionnaire and verify the values", () => {
    const abgValues = {
      pco2: "120",
      po2: "80",
    };
    facilityCreation.selectFacility("GHC Trikaripur");

    // Chain the methods instead of multiple separate calls
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickUpdateEncounter()
      .addQuestionnaire("Arterial Blood Gas")
      .fillQuestionnaire(abgValues)
      .submitQuestionnaire()
      .verifyOverviewValues(Object.values(abgValues));
  });
});
