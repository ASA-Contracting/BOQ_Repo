import type {
  BoqLookupCategory,
  BoqLookupOptionDto,
  BoqLookupTone,
  CreateBoqLookupOptionInput,
  ReorderBoqLookupOptionsInput,
  UpdateBoqLookupOptionInput,
} from "@/application/dto/boq/boqLookupOptionDto";

export interface IBoqLookupOptionRepository {
  listByCategory(category: BoqLookupCategory): Promise<BoqLookupOptionDto[]>;
  findById(id: number): Promise<BoqLookupOptionDto | null>;
  create(input: CreateBoqLookupOptionInput): Promise<BoqLookupOptionDto>;
  update(input: UpdateBoqLookupOptionInput): Promise<BoqLookupOptionDto>;
  softDelete(id: number): Promise<void>;
  reorder(input: ReorderBoqLookupOptionsInput): Promise<BoqLookupOptionDto[]>;
}

export type BoqLookupOptionRowInput = {
  name: string;
  customLabel?: string | null;
  tone?: BoqLookupTone | null;
  customHex?: string | null;
  sortOrder?: number;
};
