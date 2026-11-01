"use client";

import { useEffect, useRef } from "react";
import { useUiStore, type CreateTarget } from "@/store/ui-store";

export function useCreateRequest(
  target: Exclude<CreateTarget, null>,
  onCreate: () => void
) {
  const consumeCreate = useUiStore((state) => state.consumeCreate);
  const onCreateRef = useRef(onCreate);

  useEffect(() => {
    onCreateRef.current = onCreate;
  }, [onCreate]);

  useEffect(() => {
    if (consumeCreate(target)) onCreateRef.current();
  }, [consumeCreate, target]);
}
