"use client";

import { ArrowBigRightDash } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "./ui/animated-modal";
import { Button } from "./ui/button";
import { ReactNode } from "react";

interface AnimationProps {
  triggerText: string;
  animatedText: string;
  modalContent: ReactNode;
  modalFooter?: ReactNode;
}

export function AnimatedModal({
  triggerText,
  animatedText,
  modalContent,
  modalFooter,
}: AnimationProps) {
  return (
    <div className="flex items-center justify-center">
      <Modal>
        <ModalTrigger className="group/modal-btn flex items-center justify-center">
          <Button className="group-hover/modal-btn:translate-x-40 transition duration-500">
            {triggerText}
          </Button>
          <Button className="-translate-x-40 group-hover/modal-btn:translate-x-0 absolute inset-0 transition duration-500 z-20 my-auto">
            {animatedText} <ArrowBigRightDash />
          </Button>
        </ModalTrigger>
        <ModalBody>
          <ModalContent>{modalContent}</ModalContent>
          <ModalFooter className="gap-4">{modalFooter}</ModalFooter>
        </ModalBody>
      </Modal>
    </div>
  );
}
