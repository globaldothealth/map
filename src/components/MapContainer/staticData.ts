export const locationNameToLongLat: Record<
  string,
  { long: number; lat: number }
> = {
  "St. Helena": { long: -5.7, lat: -15.95 },
  Ascension: { long: -14.25, lat: -7.95 },
  "Canary Islands": { long: -15.5, lat: 28.25 },
  "Buenos Aires, Argentina": { long: -58.3816, lat: -34.6037 },
  "Johannesburg, South Africa": { long: 28.0473, lat: -26.2041 },
  "South Africa": { long: 22.9375, lat: -30.5595 },
  "Zurich, Switzerland": { long: 8.5417, lat: 47.3769 },
  "Amsterdam, Netherlands": { long: 4.9041, lat: 52.3676 },
  Netherlands: { long: 5.2913, lat: 52.1326 },
  "Netherlands (arrived 2026-05-07)": { long: 5.2913, lat: 52.1326 },
  "Netherlands, then Dusseldorf, Germany": { long: 6.7735, lat: 51.2277 },
  Singapore: { long: 103.8198, lat: 1.3521 },
  "Paris, France": { long: 2.3522, lat: 48.8566 },
  Nebraska: { long: -99.9018, lat: 41.4925 },
  "Rome, Italy": { long: 12.4964, lat: 41.9028 },
  "Ushuaia Argentina": { long: -68.3059, lat: -54.8019 },
  "Tristan de Cunha": { long: -12.322772, lat: -37.1052 },
  "Praia, Cape Verde": { long: -23.5087, lat: 14.933 },
  "Tenerife, Canary Islands": { long: -16.6291, lat: 28.2916 },
  "Cape Verde": { long: -24.0, lat: 16.0 },
  Tenerife: { long: -16.6291, lat: 28.2916 },
  "United Kingdom": { long: -3.436, lat: 55.3781 },
  "United States": { long: -95.7129, lat: 37.0902 },
  Spain: { long: -3.7492, lat: 40.4637 },
  France: { long: 2.2137, lat: 46.2276 },
  Canada: { long: -106.3468, lat: 56.1304 },
  Turkey: { long: 35.2433, lat: 38.9637 },
  Ireland: { long: -8.2439, lat: 53.1424 },
  "South Georgia": { long: -36.4939, lat: -54.4296 },
  "Tristan da Cunha, Inaccesible Island & Nightingale Island": {
    long: -12.322772,
    lat: -37.1052,
  },
  "Tristan da Cunha": { long: -12.322772, lat: -37.1052 },
  "Gough Island": { long: -5.3167, lat: -40.3333 },
  // Using the location between south georgia and tristan de cunha for the stop
  "%ship-04-11": { long: -24.408, lat: -45.7674 },
  "%ship-05-02": { long: -22.7, lat: 12.933 },
  "Madrid, Spain": { long: -3.7038, lat: 40.4168 },
  "Vancouver Island, British Columbia, Canada": { long: -126.0, lat: 49.0 },
  "Nebraska, US": { long: -99.9018, lat: 41.4925 },
  "Rotterdam, Netherlands": { long: 4.47917, lat: 51.9225 },
  "%ship-spain": { long: -10.153163, lat: 43.741195 },
  "%ship-france": { long: -4.809105, lat: 49.407896 },
  "%ship-london": { long: 1.162191, lat: 50.68067 },
  "%ship-belgium": { long: 2.914143, lat: 51.890459 },
};

export const shipPath = [
  {
    location: "Ushuaia Argentina",
    date: "2026-04-01",
    dateStart: "2026-04-01",
    dateEnd: "2026-04-01",
  },
  {
    location: "South Georgia",
    date: "April 4th-7th 2026",
    dateStart: "2026-04-04",
    dateEnd: "2026-04-04",
  },
  {
    location: "Tristan da Cunha, Inaccesible Island & Nightingale Island",
    date: "April 13th-16th 2026",
    dateStart: "2026-04-13",
    dateEnd: "2026-04-16",
    description:
      "The ship's itinerary listed visits to Inaccessible Island, Nightingale, and Gough Island\n" +
      "\tA British Overseas Territory. Saint Helena, Ascension and Tristan da Cunha is a British Overseas Territory located in the South Atlantic and consisting of the island of Saint Helena, Ascension Island, and the archipelago of Tristan da Cunha. \n" +
      "\tNightingale Island is part of the Nightingale Islands, which also includes islets Middle Island and Stoltenhoff Island. All three of these islands are uninhabited, but are regularly visited for scientific purposes and research. It is one of the only stops for birds in the Atlantic and millions of them visit it annually.\n" +
      "\tTristan da Cunha is described as the most remote inhabited island on earth.",
  },
  {
    location: "Gough Island",
    date: "April 17th 2026",
    dateStart: "2026-04-17",
    dateEnd: "2026-04-17",
    description:
      "A British Overseas Territory. It is a dependency of Tristan da Cunha and part of the British overseas territory of Saint Helena, Ascension and Tristan da Cunha.",
  },
  {
    location: "St. Helena",
    date: "April 21st-24th 2026",
    dateStart: "2026-04-21",
    dateEnd: "2026-04-24",
    description:
      "A British Overseas Territory. Saint Helena, Ascension and Tristan da Cunha is a British Overseas Territory located in the South Atlantic and consisting of the island of Saint Helena, Ascension Island, and the archipelago of Tristan da Cunha ",
  },
  {
    location: "Ascension",
    date: "April 27th 2026",
    dateStart: "2026-04-27",
    dateEnd: "2026-04-27",
    description:
      "A British Oversease Territory. Saint Helena, Ascension and Tristan da Cunha is a British Overseas Territory located in the South Atlantic and consisting of the island of Saint Helena, Ascension Island, and the archipelago of Tristan da Cunha ",
  },
  {
    location: "Cape Verde",
    date: "May 3rd-6th 2026",
    dateStart: "2026-05-03",
    dateEnd: "2026-05-06",
    description:
      "(Cabo Verde) The ship was originally scheduled to end in Praia, Cape Verde, on 4 May. ",
  },
  {
    location: "Tenerife, Canary Islands",
    date: "May 10th-11th 2026",
    dateStart: "2026-05-10",
    dateEnd: "2026-05-11",
    description: "Port of Granadilla",
  },
  {
    location: "%ship-spain",
    date: "May 18th 2026",
    dateStart: "2026-05-18",
  },
  {
    location: "%ship-france",
    date: "May 18th 2026",
    dateStart: "2026-05-18",
  },
  {
    location: "%ship-london",
    date: "May 18th 2026",
    dateStart: "2026-05-18",
  },
  {
    location: "%ship-belgium",
    date: "May 18th 2026",
    dateStart: "2026-05-18",
  },
  {
    location: "Rotterdam, Netherlands",
    date: "May 18th 2026",
    dateStart: "2026-05-18",
    dateEnd: "2026-05-18",
  },
];

export const significantEventsData = [
  {
    marker: 1,
    location: "Ushuaia Argentina",
    date: "April 1st 2026",
    dateStart: "2026-04-01",
    relatedCaseStatus: "",
    description:
      "The MV Hondius, a Dutch cruise vessel, departed from Ushuaia, Argentina and followed an itinerary across the South Atlantic, with multiple stops in remote and ecologically diverse regions. The extent of passenger contact with local wildlife during the voyage, or prior to boarding remains undetermined. The vessel carried a total of 175 individuals, including 114 passengers and 61 crew members.",
  },
  {
    marker: 2,
    location: "%ship-04-11",
    date: "April 11th 2026",
    dateStart: "2026-04-11",
    relatedCaseStatus: "Probable",
    description:
      "Case 1 (Gh_ID1), a 70 year old Dutch male (index case), developed symptoms of fever, headache, and mild diarrhea on April 3. His condition progressed on April 6 to include dizziness, tachychardia, and tachypnoea, with further clinical deterioration. He died on board the vessel on April 11. No microbiological tests were performed and he is considered a probable case. His body was removed from the ship in Saint Helena on April 24.",
  },
  {
    marker: 3,
    location: "Tristan da Cunha",
    date: "April 14th 2026",
    dateStart: "2026-04-14",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 8 (Gh_ID12), a 65 year old British male, disembarked the ship in Tristan da Cunha, where he is a local resident, on April 15. He reported onset of symptoms on April 28 with diarrhea, and fever on April 30. He was admitted to hospital on May 2. Lab testing confirmed a positive hantavirus test result for the individual, who was previously considered a probable case. He has since recovered (as of June 10) and is now clinically well at home in Tristan de Cunha.",
  },
  {
    marker: 4,
    location: "St. Helena",
    date: "April 24th 2026",
    dateStart: "2026-04-24",
    relatedCaseStatus: "",
    description:
      "Thirty-two passengers disembarked the ship in Saint Helena, including the following known nationalities: United Kingdom (7), United States (6), Netherlands (3), Canada (2), Switzerland (2), Turkey (2), Germany (1), Denmark (1), St. Kitts and Nevis (1), New Zealand (1), Singapore (1), Sweden (1), Unknown (4).",
  },
  {
    marker: 5,
    location: "Johannesburg, South Africa",
    date: "April 25th 2026",
    dateStart: "2026-04-25",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 2 (Gh_ID2) is a 69 year old Dutch female and wife of Case 1. She disembarked the ship in Saint Helena on April 24 with gastrointestinal symptoms (onset April 22) and flew to Johannesburg, South Africa.  Her condition worsened during travel. She boarded a connecting flight to Europe, but was too ill to take her scheduled flight and was taken off the plane in Johannesburg and died upon arrival at the emergency department on April 26. Post-mortem PCR testing confirmed hantavirus infection on May 4.",
  },
  {
    marker: 6,
    location: "Johannesburg, South Africa",
    date: "May 2nd 2026",
    dateStart: "2026-05-02",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 3 (Gh_ID3), a 60 year old British male, developed symptoms of febrile illness, shortness of breath, and signs of pneumonia while onbaord the ship on April 21. His condition worsened on April 26 and he was medically evacuated from Ascension to South Africa on April 27 and was hospitalized in the ICU.  PCR testing confirmed hantavirus infection on May 2. NICD reports that he has since been discharged from the hospital and has returned to the United Kingdom.",
  },
  {
    marker: 7,
    location: "%ship-05-02",
    date: "May 2nd 2026",
    dateStart: "2026-05-02",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 4 (Gh_ID4), an 80 year old German female, developed fever, malaise, and respiratory symptoms on April 23. She developed pneumonia and died on May 2. Post-mortem sampling confirmed Andes virus on May 8.",
  },
  {
    marker: 8,
    location: "Zurich, Switzerland",
    date: "May 5th 2026",
    dateStart: "2026-05-05",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 7 (Gh_ID5), a 64 year old male of Swiss nationality, disembarked the ship in Saint Helena on April 22. He flew back to Switzerland on April 27-28 through South Africa and Qatar. He developed symptoms of fever, headache, fatigue, and nausea on May 1 after arrival in Switzerland and was hospitalized in isolation. PCR testing confirmed Andes virus on May 5. He has since recovered as of May 29th.",
  },
  {
    marker: 9,
    location: "Praia, Cape Verde",
    date: "May 6th 2026",
    dateStart: "2026-05-06",
    relatedCaseStatus: "",
    description:
      "The ship anchored off the coast of Cape Verde on May 3.  Medical staff embarked the vessel. Three suspected cases were taken off the ship and transferred to the Netherlands for care on May 6.  The ship was given permission to proceed to Tenerife, Canary Islands, Spain, for all passengers to disembark and be repatriated to their home countries.",
  },
  {
    marker: 10,
    location: "Praia, Cape Verde",
    date: "May 6th 2026",
    dateStart: "2026-05-06",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 5 (Gh_ID8), a 41 year old Dutch male, working as the ship doctor, reported onset of symptoms on April 30, including fever, fatigue, muscle pain and mild respiratory symptoms. He was one of three suspected cases removed from the ship in Cape Verde. PCR testing confirmed Andes virus on May 7 and he was medically evacuated to the Netherlands. He has since recovered as of May 20th",
  },
  {
    marker: 11,
    location: "Praia, Cape Verde",
    date: "May 6th 2026",
    dateStart: "2026-05-06",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 6 (Gh_ID7), a 56 year old British male working as a ship expedition guide, developed symptoms on April 27, including high fever, fatigue and diarrhea. PCR testing confirmed Andes virus on May 7. He was one of three suspected cases removed from the ship in Cape Verde and was medically evacuated to the Netherlands on May 7 for treatment.  He has since recovered and medically evacuated back to the United Kingdom on May 28th for self-isolation.",
  },
  {
    marker: 12,
    location: "Tenerife, Canary Islands",
    date: "May 10th 2026",
    dateStart: "2026-05-10",
    relatedCaseStatus: "",
    description:
      "The MV Hondius arrived in the Canary Islands and was anchored off the coast at the Port of Granadilla in Tenerife. A total of 122 people (87 guests, 35 crew) disembarked and were repatriated to their home countries. Twenty-seven people (25 crew, 2 medical staff) remained onboard to return the vessel to Rotterdam, the Netherlands. The ship departed from Tenerife on May 11 with a provisional date of arrival in Rotterdam on May 18.",
  },
  {
    marker: 13,
    location: "Nebraska, US",
    date: "May 10th 2026",
    dateStart: "2026-05-10",
    relatedCaseStatus: "",
    description:
      "The MV Hondius arrived in the Canary Islands and was anchored off the coast at the Port of Granadilla in Tenerife. A total of 122 people (87 guests, 35 crew) disembarked and were repatriated to their home countries. Twenty-seven people (25 crew, 2 medical staff) remained onboard to return the vessel to Rotterdam, the Netherlands. The ship departed from Tenerife on May 11 with a provisional date of arrival in Rotterdam on May 18.",
  },
  {
    marker: 14,
    location: "Paris, France",
    date: "May 11th 2026",
    dateStart: "2026-05-11",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 9 (Gh_ID15), a 73 year old French female, developed symptoms during the evacuation flight from Tenerife to Paris on May 10. Her symptoms worsened and she tested positive for hantavirus on May 11 and was admitted to a Paris hospital in critical condition. She has since recovered from the hantavirus infection as of June 21, but remained in intensive care for months. On August 6, the French Ministry of Health announced that she was transferred to a convalescent center.",
  },
  {
    marker: 15,
    location: "Madrid, Spain",
    date: "May 12th 2026",
    dateStart: "2026-05-12",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 10 (Gh_ID18), a 70 year old Spanish female, tested provisionally positive after disembarking from the ship in Tenerife on May 11 and was evacuated to Spain. The patient developed symptoms on May 12, was officially confirmed as positive, and was quarantined at a hospital in Madrid. She has since recovered as of June 4.",
  },
  {
    marker: 16,
    location: "Vancouver Island, British Columbia, Canada",
    date: "May 17th 2026",
    dateStart: "2026-05-17",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 11 (Gh_ID20) is a Canadian citizen who was confirmed positive for Andes hantavirus on May 16 following a presumptive positive test result the day prior. The patient developed mild symptoms on May 14 and was transported to a hospital in Vancouver for care along with their spouse, who also had mild symptoms but tested negative. The couple were passengers on the MV Hondius. Their spouse never tested positive, and Case 11 has since recovered as of June 6.",
  },
  {
    marker: 17,
    location: "Netherlands",
    date: "May 22nd 2026",
    dateStart: "2026-05-22",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 12 (Gh_ID23) is a Dutch national who was confirmed positive for hantavirus on May 22.  The person was a crew member who left the ship in Tenerife, Canary Islands, Spain, was repatriated, and was isolating in home quarantine prior to the positive test. Laboratory tests by RIVM, which are administered every week to all persons in quarantine in the Netherlands, indicated that the person has Andes virus. The patient was subsequently admitted to hospital and put in isolation. They subsequently experienced symptom onset on May 27. They have since recovered as of June 18.",
  },
  {
    marker: 18,
    location: "Spain",
    date: "May 25th 2026",
    dateStart: "2026-05-25",
    relatedCaseStatus: "Confirmed",
    description:
      "Case 13 (Gh_ID24) is a Spanish national who was confirmed positive for hantavirus on May 25. This is the second positive case among the fourteen Spanish nationals aboard the ship who were evacuated from Tenerife to Madrid. The patient had been in preventive quarantine at the Gomez Ulla Hospital in Madrid and was detected during the periodic checks carried out on the contacts under follow-up. Following PCR confirmation, the patient was transferred to the High-Level Isolation Unit of the hospital under specialized medical supervision with biosafety measures in place. They subsequently experienced symptom onset on May 31. The patient has since recovered as of June 22.",
  },
];

export const transfers = [
  {
    from: "Tenerife, Canary Islands",
    to: "Netherlands",
    date: "2026-05-11",
    cases: 54,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "United Kingdom",
    date: "2026-05-11",
    cases: 22,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "United States",
    date: "2026-05-11",
    cases: 18,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "Spain",
    date: "2026-05-11",
    cases: 14,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "France",
    date: "2026-05-11",
    cases: 5,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "Canada",
    date: "2026-05-11",
    cases: 4,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "Turkey",
    date: "2026-05-11",
    cases: 3,
  },
  {
    from: "Tenerife, Canary Islands",
    to: "Ireland",
    date: "2026-05-11",
    cases: 2,
  },
];
