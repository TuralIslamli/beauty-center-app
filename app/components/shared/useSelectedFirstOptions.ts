import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Поднимает выбранные пункты в начало списка (MultiSelect / Dropdown).
 *
 * Порядок пересчитывается только пока список закрыт. Если сортировать на лету,
 * отмеченный пункт уезжает вверх прямо из-под курсора и следующий клик попадает
 * не туда — поэтому на время открытия порядок замораживается.
 *
 * Возвращает готовые пропсы для примеровского компонента:
 *   const serviceTypeOptions = useSelectedFirstOptions(serviceTypes, selected);
 *   <MultiSelect value={selected} {...serviceTypeOptions} />
 */
export const useSelectedFirstOptions = <T extends { id: number }>(
  options?: T[],
  selected?: T[],
) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isPanelOpen) return;

    const nextIds = (selected ?? []).map((item) => item.id);

    setPinnedIds((prev) =>
      prev.length === nextIds.length &&
      nextIds.every((id, index) => prev[index] === id)
        ? prev
        : nextIds,
    );
  }, [isPanelOpen, selected]);

  const orderedOptions = useMemo(() => {
    if (!options?.length || !pinnedIds.length) return options;

    const pinned = new Set(pinnedIds);

    return [
      ...options.filter((item) => pinned.has(item.id)),
      ...options.filter((item) => !pinned.has(item.id)),
    ];
  }, [options, pinnedIds]);

  const onShow = useCallback(() => setIsPanelOpen(true), []);
  const onHide = useCallback(() => setIsPanelOpen(false), []);

  return { options: orderedOptions, onShow, onHide };
};

export default useSelectedFirstOptions;
