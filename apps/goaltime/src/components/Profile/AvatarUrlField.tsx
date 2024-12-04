import { User } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/ui-components/form";
import { getDefaultValue, UserProfileInput, UserProfileSchema } from "@/shared/zod";
import { FileUploader, FileInput } from "@/ui-components/file-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui-components/avatar"
import { UseFormReturn } from "react-hook-form";
import { DropzoneOptions, FileError, ErrorCode } from "react-dropzone";
import { useToast } from "@/ui-components/hooks/use-toast";

const FileSvgDraw = () => {
  return (
    <div className="flex flex-col items-center text-center justify-center p-2">
      <svg
        className="w-8 h-8 mb-2"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm">
        <span className="font-semibold">Click or drop photo</span>
      </p>
      <p className="text-xs text-muted-foreground">
        SVG, PNG, JPG or GIF
      </p>
    </div>
  );
};

export interface AvatarUrlFieldProps {
  form: UseFormReturn<UserProfileInput>
  setImage: (file: File | null) => void
}

export function AvatarUrlField({ form, setImage }: AvatarUrlFieldProps) {
  const { toast} = useToast();
  const dropzoneOptions = {
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    multiple: false,
    maxSize: 10,
    onError: (err) => {
      console.log(`error: ${err}`);
      toast({
        title: "Error",
        variant: "destructive",
        description: err.message,
      });
    },
    validator: (file) => {
      if (file.size > 1 * 1024 * 1024) {
        form.setError("avatarUrl", {
          message: "File must be less than 1MB",
        });
        const defaultUrl = getDefaultValue(UserProfileSchema.shape.avatarUrl);
        form.setValue("avatarUrl", defaultUrl);
        return {
          code: ErrorCode.FileTooLarge,
          message: "File must be less than 1MB",
        } satisfies FileError;
      }
      return null;
    },
    onDropRejected: (files) => {
      console.log(`rejected: ${files}`);
      toast({
        title: "Error",
        variant: "destructive",
        description: files[0].errors[0].message,
      });
    }
  } satisfies DropzoneOptions;
  return (
    <FormField
      control={form.control}
      name="avatarUrl"
      render={({ field }) => (
        <FormItem className="mb-4 pl-2">
          <FormLabel className="flex justify-center items-center gap-2 w-full">
            Avatar
            <span className="text-xs text-muted-foreground">
              (optional)
            </span>
          </FormLabel>
          <FormControl>
            <div className="flex flex-col justify-center items-center gap-4">
              <Avatar>
                <AvatarImage src={field.value} />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
              <FileUploader
                id="avatar-upload"
                value={null}
                onValueChange={(files) => {
                  const url = files?.[0] ? URL.createObjectURL(files[0]) : null
                  if (url && files) {
                    field.onChange(url);
                    setImage(files[0])
                  }
                }}
                dropzoneOptions={dropzoneOptions}
                className="relative max-w-xs space-y-1 p-2"
              >
                <FileInput onChange={(event) => {
                  const files = (event.target as HTMLInputElement).files;
                  const url = files?.[0] ? URL.createObjectURL(files[0]) : null;
                  if (url) {
                    field.onChange(url);
                  }
                }} className="outline-dashed outline-1 outline-background-foreground">
                  <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
                    <FileSvgDraw />
                  </div>
                </FileInput>
              </FileUploader>
              <FormMessage className="pl-2" />
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  )
}
