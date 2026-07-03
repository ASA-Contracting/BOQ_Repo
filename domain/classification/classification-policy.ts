import type {
  CodingRulesEntity,
  LevelOptionEntity,
  LevelOrderEntity,
  LevelTypeEntity,
} from './entities';

export const CODE_SEPARATOR = '-';
export const PATH_SEPARATOR = ',';

export const DEFAULT_CODING_RULES: CodingRulesEntity = {
  separator: CODE_SEPARATOR,
  serialLength: 3,
  serialResetScope: 'spec',
  allowCustomSpec: true,
  specRequired: true,
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeToken = (value: string): string =>
  String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9._-]/g, '');

export const normalizeSpec = (value: string): string => normalizeToken(value);

export const parsePathIds = (value?: string | null): number[] => {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => toNumber(entry)).filter((id) => id > 0);
      }
    } catch {
      return [];
    }
  }

  return raw
    .split(/[|,/>]+/)
    .map((entry) => toNumber(entry.trim()))
    .filter((id) => id > 0);
};

export const buildPathIds = (ids: number[]): string =>
  ids.filter((id) => id > 0).join(PATH_SEPARATOR);

export const buildLevelToken = (
  level: LevelTypeEntity | undefined,
  option: LevelOptionEntity | undefined
): string => {
  if (!level || !option) {
    return '';
  }
  const raw = level.isNumeric ? (option.value ?? option.name) : option.name;
  const token = normalizeToken(String(raw ?? ''));
  if (!token) {
    return '';
  }
  return `${level.prefix ?? ''}${token}${level.suffix ?? ''}`;
};

export const buildCodeFromPath = (params: {
  levels: LevelOrderEntity[];
  levelTypes: LevelTypeEntity[];
  options: LevelOptionEntity[];
  pathIds: number[];
  separator?: string;
}): string => {
  const separator = params.separator ?? CODE_SEPARATOR;
  const levelMap = new Map(params.levelTypes.map((item) => [item.id, item]));
  const optionMap = new Map(params.options.map((item) => [item.id, item]));
  const sortedLevels = [...params.levels].sort((a, b) => a.order - b.order);

  const tokens: string[] = [];
  let valid = true;

  sortedLevels.forEach((level, index) => {
    if (!valid) {
      return;
    }
    const optionId = params.pathIds[index];
    if (!optionId) {
      if (level.isRequired) {
        valid = false;
      }
      return;
    }
    const token = buildLevelToken(
      levelMap.get(level.levelTypeId),
      optionMap.get(optionId)
    );
    if (!token && level.isRequired) {
      valid = false;
      return;
    }
    if (token) {
      tokens.push(token);
    }
  });

  if (!valid || !tokens.length) {
    return '';
  }
  return tokens.join(separator);
};

export const getExpectedChildLevelTypeId = (
  parentId: number | null,
  chainSteps: LevelOrderEntity[],
  getNodePathLength: (nodeId: number) => number
): number | null => {
  if (!chainSteps.length) {
    return null;
  }
  if (parentId == null) {
    return chainSteps[0]?.levelTypeId ?? null;
  }
  return chainSteps[getNodePathLength(parentId)]?.levelTypeId ?? null;
};
