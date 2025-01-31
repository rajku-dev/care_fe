import {
  generateAddress,
  generateName,
  generatePhoneNumber,
} from "utils/commonUtils";

import {
  PatientFormData,
  patientCreation,
} from "@/pageObject/Patients/PatientCreation";
import { patientDashboard } from "@/pageObject/Patients/PatientDashboard";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { patientVerify } from "@/pageObject/Patients/PatientVerify";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const ENCOUNTER_TYPE = "Observation";
const ENCOUNTER_STATUS = "In Progress";
const ENCOUNTER_PRIORITY = "ASAP";

describe("Patient Management", () => {
  const TEST_PHONE = "9495031234";
  const PATIENT_DETAILS = {
    name: "Nihal",
    phone: TEST_PHONE,
  };

  const basePatientData: Partial<PatientFormData> = {
    pincode: "682001",
    state: "Kerala",
    district: "Ernakulam",
    localBody: "Aluva",
    ward: "4",
    sameAsPermanentAddress: true,
    hasEmergencyContact: false,
  };

  const patientTestCases: Array<{
    description: string;
    data: PatientFormData;
  }> = [
    {
      description: "non-binary patient | O+ blood group | multi-line address",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: false,
        gender: "Non_Binary",
        bloodGroup: "O+",
        age: "25",
        address: generateAddress(true),
      } as PatientFormData,
    },
    {
      description:
        "transgender patient | AB+ blood group | with emergency contact",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: false,
        gender: "Transgender",
        bloodGroup: "AB+",
        age: "30",
        address: generateAddress(),
      } as PatientFormData,
    },
    {
      description: "female patient | different addresses | same phone number",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: false,
        gender: "Female",
        bloodGroup: "Unknown",
        age: "25",
        sameAsPermanentAddress: false,
        address: generateAddress(),
        permanentAddress: generateAddress(),
      } as PatientFormData,
    },
    {
      description:
        "standard male patient | same address | different emergency contact",
      data: {
        ...basePatientData,
        name: generateName(),
        phoneNumber: generatePhoneNumber(),
        hasEmergencyContact: true,
        emergencyPhoneNumber: generatePhoneNumber(),
        gender: "Male",
        bloodGroup: "B+",
        dateOfBirth: "01-01-1990",
        address: generateAddress(),
      } as PatientFormData,
    },
    // ... other test cases ...
  ];

  beforeEach(() => {
    cy.loginByApi("doctor");
    cy.visit("/");
  });

  patientTestCases.forEach(({ description, data }) => {
    it(`creates a new ${description} and verifies registration`, () => {
      facilityCreation.selectFacility("GHC Trikaripur");
      patientCreation
        .clickSearchPatients()
        .clickCreateNewPatient()
        .fillPatientDetails(data)
        .submitPatientForm()
        .assertPatientRegistrationSuccess();

      // Verify encounter creation
      patientVerify
        .verifyPatientName(data.name)
        .verifyCreateEncounterButton()
        .clickCreateEncounter()
        .selectEncounterType(ENCOUNTER_TYPE)
        .selectEncounterStatus(ENCOUNTER_STATUS)
        .selectEncounterPriority(ENCOUNTER_PRIORITY)
        .clickSubmitEncounter()
        .assertEncounterCreationSuccess();

      patientDashboard.verifyEncounterPatientInfo([
        ENCOUNTER_TYPE,
        ENCOUNTER_STATUS,
        ENCOUNTER_PRIORITY,
      ]);
    });
  });

  it("Search patient with phone number and create a new encounter", () => {
    facilityCreation.selectFacility("GHC Trikaripur");
    patientCreation
      .clickSearchPatients()
      .searchPatient(TEST_PHONE)
      .verifySearchResults(PATIENT_DETAILS)
      .selectPatientFromResults(PATIENT_DETAILS.name)
      .enterYearOfBirth("1999")
      .clickVerifyButton();

    patientVerify
      .verifyPatientName(PATIENT_DETAILS.name)
      .verifyCreateEncounterButton()
      .clickCreateEncounter()
      .selectEncounterType(ENCOUNTER_TYPE)
      .selectEncounterStatus(ENCOUNTER_STATUS)
      .selectEncounterPriority(ENCOUNTER_PRIORITY)
      .clickSubmitEncounter()
      .assertEncounterCreationSuccess();

    patientDashboard.verifyEncounterPatientInfo([
      ENCOUNTER_TYPE,
      ENCOUNTER_STATUS,
      ENCOUNTER_PRIORITY,
    ]);
  });

  it("Edit a patient details and verify the changes", () => {
    const updatedPatientData: Partial<PatientFormData> = {
      gender: "Female",
      bloodGroup: "AB+",
      address: generateAddress(true),
    };

    facilityCreation.selectFacility("GHC Trikaripur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton()
      .clickPatientEditButton();

    patientCreation
      .selectGender(updatedPatientData.gender)
      .selectBloodGroup(updatedPatientData.bloodGroup)
      .enterAddress(updatedPatientData.address, true)
      .submitPatientUpdateForm()
      .verifyUpdateSuccess();

    cy.verifyContentPresence("#general-info", [
      updatedPatientData.gender,
      updatedPatientData.address,
    ]);
  });
});
