import { FormField } from "@/components/ui/form-field";
import { Select, SelectOption } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";

export type FamilyFormValues = {
  name: string;
  referenceCode: string;
  description: string;
  familyLevelTypeId: string;
  parentId: string;
};

type FamilyLevelTypeOption = {
  id: number;
  name: string;
};

type ParentOption = {
  id: number;
  label: string;
};

type FamilyFormFieldsProps = {
  levelTypes: FamilyLevelTypeOption[];
  parentOptions: ParentOption[];
  values: FamilyFormValues;
  fieldErrors?: Partial<Record<keyof FamilyFormValues, string>>;
  onChange: (field: keyof FamilyFormValues, value: string) => void;
  disabled?: boolean;
  showParentField?: boolean;
};

export function FamilyFormFields({
  levelTypes,
  parentOptions,
  values,
  fieldErrors,
  onChange,
  disabled = false,
  showParentField = true,
}: FamilyFormFieldsProps) {
  return (
    <div className="space-y-4">
      <TextField
        id="family-name"
        name="name"
        label="Name"
        value={values.name}
        onChange={(event) => onChange("name", event.target.value)}
        disabled={disabled}
        required
        maxLength={100}
        error={fieldErrors?.name}
      />

      <TextField
        id="family-reference-code"
        name="referenceCode"
        label="Reference code"
        value={values.referenceCode}
        onChange={(event) => onChange("referenceCode", event.target.value)}
        disabled={disabled}
        maxLength={500}
        error={fieldErrors?.referenceCode}
      />

      <TextareaField
        id="family-description"
        name="description"
        label="Description"
        value={values.description}
        onChange={(event) => onChange("description", event.target.value)}
        disabled={disabled}
        maxLength={4000}
        error={fieldErrors?.description}
      />

      <FormField
        id="family-level-type"
        label="Level type"
        required
        error={fieldErrors?.familyLevelTypeId}
      >
        <Select
          name="familyLevelTypeId"
          value={values.familyLevelTypeId}
          onChange={(event) =>
            onChange("familyLevelTypeId", event.target.value)
          }
          disabled={disabled}
          required
        >
          <SelectOption value="" disabled>
            Select a level type
          </SelectOption>
          {levelTypes.map((levelType) => (
            <SelectOption key={levelType.id} value={String(levelType.id)}>
              {levelType.name}
            </SelectOption>
          ))}
        </Select>
      </FormField>

      {showParentField ? (
        <FormField
          id="family-parent-id"
          label="Parent"
          error={fieldErrors?.parentId}
        >
          <Select
            name="parentId"
            value={values.parentId}
            onChange={(event) => onChange("parentId", event.target.value)}
            disabled={disabled}
          >
            <SelectOption value="">Root family</SelectOption>
            {parentOptions.map((option) => (
              <SelectOption key={option.id} value={String(option.id)}>
                {option.label}
              </SelectOption>
            ))}
          </Select>
        </FormField>
      ) : null}
    </div>
  );
}

export function createEmptyFamilyFormValues(
  defaults?: Partial<FamilyFormValues>,
): FamilyFormValues {
  return {
    name: "",
    referenceCode: "",
    description: "",
    familyLevelTypeId: "",
    parentId: "",
    ...defaults,
  };
}

export function familyDetailToFormValues(detail: {
  name: string;
  referenceCode: string | null;
  description: string | null;
  familyLevelTypeId: number;
  parentId: number | null;
}): FamilyFormValues {
  return {
    name: detail.name,
    referenceCode: detail.referenceCode ?? "",
    description: detail.description ?? "",
    familyLevelTypeId: String(detail.familyLevelTypeId),
    parentId: detail.parentId ? String(detail.parentId) : "",
  };
}
