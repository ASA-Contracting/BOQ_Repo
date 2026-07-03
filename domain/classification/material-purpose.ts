export enum MaterialPurpose {
  SystemOption = 1,
  UserMaterial = 2,
}

export const isSystemOption = (purpose: MaterialPurpose): boolean =>
  purpose === MaterialPurpose.SystemOption;
