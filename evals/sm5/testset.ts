import type { ReportCategory } from "@/lib/supabase/types";

// SM-5-testsettet (Story 2.5, AR-15, FR-4): 20 oppdiktede norske beskrivelser,
// fire per kategori, med fasit. Alle tekstene er laget for testen. Ingen
// virkelige navn, adresser eller personopplysninger, så settet kan sendes til
// en leverandør uten at noe ekte forlater maskinen (PRD §8).
//
// Fasiten er den kategorien en moderator ville valgt. Der to kategorier passer,
// står begrunnelsen i `note`. Endres en tekst eller fasit, må hele testen
// kjøres på nytt for alle leverandørene.

export type SM5Case = {
  id: string;
  description: string;
  expected: ReportCategory;
  /** Begrunnelse for fasiten der to kategorier kunne passet. */
  note?: string;
};

export const SM5_TESTSET: readonly SM5Case[] = [
  // waste: søppel og boss
  {
    id: "sm5-01",
    description: "Søppelkassen ved hovedinngangen er full og flyter over. Det ligger poser på bakken, og måkene river dem opp.",
    expected: "waste",
  },
  {
    id: "sm5-02",
    description: "Boss etter fredagsfesten ligger igjen på plassen bak kantina. Flasker, bokser og pizzakartonger.",
    expected: "waste",
  },
  {
    id: "sm5-03",
    description: "Ingen har tømt containeren ved bygg C på over en uke, og det lukter vondt.",
    expected: "waste",
  },
  {
    id: "sm5-04",
    description:
      "Hundebæsj-poser er kastet i buskene langs stien ned til kaia, ikke i søppelbøttene som står der. Det ligger fem-seks stykker.",
    expected: "waste",
  },

  // lighting: gatelys og belysning
  {
    id: "sm5-05",
    description: "Gatelyset ved gangbrua mot studentboligene har vært slukket i flere uker, og det er helt mørkt der om kvelden.",
    expected: "lighting",
  },
  {
    id: "sm5-06",
    description: "Lysene i parkeringskjelleren blinker og går av og på. Man ser ikke hvor man går.",
    expected: "lighting",
  },
  {
    id: "sm5-07",
    description: "Lampen over trappa utenfor bygg A mangler pære. Trappa er glatt, og man ser ikke trinnene når det er mørkt.",
    expected: "lighting",
  },
  {
    id: "sm5-08",
    description:
      "Gatelyset ved gangbrua blinker og er ofte helt av, så stien blir mørk. Jeg snublet også i et hull i asfalten der i går.",
    expected: "lighting",
    note: "Tvetydig: belysning og hull. Lyset er det første og det som gjør hullet farlig, så fasiten er lighting.",
  },

  // roads_sidewalks: hull, vei, fortau og sti
  {
    id: "sm5-09",
    description: "Stort hull i asfalten rett utenfor inngangen til biblioteket. Flere har snublet, og en syklist falt i går.",
    expected: "roads_sidewalks",
  },
  {
    id: "sm5-10",
    description: "Fortauet langs hovedveien er sprukket og hevet av trerøtter, så rullestol og barnevogn kommer ikke forbi.",
    expected: "roads_sidewalks",
  },
  {
    id: "sm5-11",
    description: "Hullet i veien er blitt skikkelig stort etter regnet. Biler må svinge rundt det, og det er farlig for syklister.",
    expected: "roads_sidewalks",
  },
  {
    id: "sm5-12",
    description: "Snarveien over jordet er full av gjørme og vann. Stien er nesten umulig å gå uten å bli våt til knærne.",
    expected: "roads_sidewalks",
  },

  // vandalism: hærverk, skadeverk og tagging
  {
    id: "sm5-13",
    description: "Noen har malt tagging over hele veggen på sykkelskuret. Det står stygge ord, og malingen er fortsatt fersk.",
    expected: "vandalism",
  },
  {
    id: "sm5-14",
    description: "Ruta i bussholdeplassen er knust, og glasset ligger utover. Ser ut som noen har kastet en stein.",
    expected: "vandalism",
  },
  {
    id: "sm5-15",
    description: "Lyktestolpen ved sykkelparkeringen er knust, og glasset ligger utover fortauet. Det ser ut som noen har slått den med noe tungt.",
    expected: "vandalism",
    note: "Tvetydig: knust lys og hærverk. Hærverket er årsaken og det moderator må følge opp, så fasiten er vandalism.",
  },
  {
    id: "sm5-16",
    description: "Noen har ødelagt tre av benkene i parken. Sitteflatene er revet av og slengt i busken.",
    expected: "vandalism",
  },

  // other: alt annet
  {
    id: "sm5-17",
    description: "Det er et vepsebol under takskjegget ved inngangen til bygg B, og flere har blitt stukket.",
    expected: "other",
  },
  {
    id: "sm5-18",
    description: "Den automatiske døra til biblioteket åpner seg ikke lenger, så de som bruker rullestol må vente på hjelp utenfra.",
    expected: "other",
  },
  {
    id: "sm5-19",
    description: "Informasjonsskiltet ved bussholdeplassen viser feil avgangstider, og det har stått slik siden i fjor høst.",
    expected: "other",
  },
  {
    id: "sm5-20",
    description:
      "Byggearbeidet ved nybygget starter med høy støy klokka seks hver morgen. Det er vanskelig å sove i studentboligene ved siden av.",
    expected: "other",
  },
];
