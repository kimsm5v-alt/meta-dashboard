let counter = 0;

/** 렌더링 안전한 순차 ID 생성 */
export const nextId = (prefix = 'm'): string => {
  counter += 1;
  return `${prefix}-${counter}`;
};
