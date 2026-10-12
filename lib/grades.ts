// The classes the school runs this year, in order. Change this list (and the
// matching documents in the Firestore `grades` collection) when a class is
// added or dropped.
//   level  — sort order; matches `level` on the Firestore grade document
//   slug   — homework page URL: /homework/<slug>
//   navKey — label in the Nav translations
//   name   — Polish name, as stored on the Firestore grade document
export const SCHOOL_GRADES = [
  {level: -1, slug: 'przedszkole', navKey: 'preschool', name: 'Przedszkole'},
  {level: 0,  slug: 'klasa-0',     navKey: 'class0',    name: 'Klasa 0'},
  {level: 1,  slug: 'klasa-1',     navKey: 'class1',    name: 'Klasa 1'},
  {level: 2,  slug: 'klasa-2',     navKey: 'class2',    name: 'Klasa 2'},
  {level: 3,  slug: 'klasa-3',     navKey: 'class3',    name: 'Klasa 3'},
  {level: 4,  slug: 'klasa-4',     navKey: 'class4',    name: 'Klasa 4'},
  {level: 5,  slug: 'klasa-5',     navKey: 'class5',    name: 'Klasa 5'},
  {level: 6,  slug: 'klasa-6',     navKey: 'class6',    name: 'Klasa 6'},
  {level: 7,  slug: 'klasa-7',     navKey: 'class7',    name: 'Klasa 7'},
  {level: 8,  slug: 'klasa-8',     navKey: 'class8',    name: 'Klasa 8'},
  {level: 9,  slug: 'liceum-1',    navKey: 'liceum1',   name: 'I Liceum'},
  {level: 10, slug: 'liceum-2',    navKey: 'liceum2',   name: 'II Liceum'},
  {level: 11, slug: 'liceum-3',    navKey: 'liceum3',   name: 'III Liceum'},
] as const
