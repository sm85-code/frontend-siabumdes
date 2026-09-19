import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast bg-[#FFFcf7] text-[#243028] border-[#D7DFD4] shadow-lg rounded-xl",
          description: "text-[#5C6B62]",
          actionButton: "bg-[#1F4E3D] text-white",
          cancelButton: "bg-[#E7EFE8] text-[#1F4E3D]",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
