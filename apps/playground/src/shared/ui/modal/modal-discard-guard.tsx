"use client";

import { ModalButton } from "./modal-button";
import { useModalDismissGuard } from "./modal-context";
import { ModalLayout } from "./modal-layout";
import { openModal } from "./modal-store";

const askDiscard = async () => {
  const isDiscarded = await openModal<boolean>(
    () => (
      <ModalLayout
        title="저장하지 않고 닫을까요?"
        description="입력한 내용이 사라집니다."
        showCloseButton={false}
        footer={
          <>
            <ModalButton variant="outline" data-autofocus>
              계속 작성
            </ModalButton>
            <ModalButton variant="destructive" value>
              닫기
            </ModalButton>
          </>
        }
      />
    ),
    { role: "alertdialog" },
  );
  return isDiscarded === true;
};

/** Asks "저장하지 않고 닫을까요?" before dismissing while `isDirty`; for forms in modals. */
export const useModalDiscardGuard = (isDirty: boolean) => {
  useModalDismissGuard(isDirty ? askDiscard : null);
};
