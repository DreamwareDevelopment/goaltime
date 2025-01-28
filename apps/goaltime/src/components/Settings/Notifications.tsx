import React from 'react';
import { UseFormReturn } from "react-hook-form";

import { Checkbox } from '@/ui-components/checkbox';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { FormControl, FormField, FormItem } from "@/ui-components/form";
import { GoalInput, MAX_NOTIFICATION_EVENT_OFFSET, NotificationSettingsInput } from "@/shared/zod";

interface NotificationSettingsProps {
  form: UseFormReturn<GoalInput>;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="notifications"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="flex items-center justify-center w-full">
              <div className="flex flex-col items-start w-full justify-between space-y-4 p-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor={`text-before-input`}>{`Notify before event`}</Label>
                  <Checkbox
                    id={`text-before-checkbox`}
                    className="mx-4"
                    checked={field.value[`textBefore` as keyof NotificationSettingsInput] !== null}
                    onCheckedChange={(checked) => {
                      const updatedNotifications = {
                        ...field.value,
                        [`textBefore`]: checked ? 0 : null,
                      };
                      field.onChange(updatedNotifications);
                    }}
                  />
                  {field.value[`textBefore` as keyof NotificationSettingsInput] !== null ? (
                    <>
                      <Input
                        id={`text-before-input`}
                        type="number"
                        className="w-14"
                        min={0}
                        max={MAX_NOTIFICATION_EVENT_OFFSET}
                        value={(field.value[`textBefore` as keyof NotificationSettingsInput] ?? undefined) as number}
                        onChange={(e) => {
                          const updatedNotifications = {
                            ...field.value,
                            [`textBefore`]: Number(e.target.value),
                          };
                          field.onChange(updatedNotifications);
                        }}
                      />
                      <span className="text-sm text-muted-foreground pl-2">minutes</span>
                    </>
                  ) : null}
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor={`text-after-input`}>{`Notify after event`}</Label>
                  <Checkbox
                    id={`text-after-checkbox`}
                    className="mx-4"
                    checked={field.value[`textAfter` as keyof NotificationSettingsInput] !== null}
                    onCheckedChange={(checked) => {
                      const updatedNotifications = {
                        ...field.value,
                        [`textAfter`]: checked ? 0 : null,
                      };
                      field.onChange(updatedNotifications);
                    }}
                  />
                  {field.value[`textAfter` as keyof NotificationSettingsInput] !== null ? (
                    <>
                      <Input
                        id={`text-after-input`}
                        type="number"
                        className="w-14"
                        min={0}
                        max={MAX_NOTIFICATION_EVENT_OFFSET}
                        value={(field.value[`textAfter` as keyof NotificationSettingsInput] ?? undefined) as number}
                        onChange={(e) => {
                          const updatedNotifications = {
                            ...field.value,
                            [`textAfter`]: Number(e.target.value),
                          };
                          field.onChange(updatedNotifications);
                        }}
                      />
                      <span className="text-sm text-muted-foreground pl-2">minutes</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};