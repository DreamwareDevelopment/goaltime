import React from 'react';
import { UseFormReturn } from "react-hook-form";

import { Checkbox } from '@/ui-components/checkbox';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-components/tabs';
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
            <Tabs defaultValue="push">
              <TabsList className="w-full">
                <TabsTrigger className="w-full" value="push">Push</TabsTrigger>
                <TabsTrigger className="w-full" value="text">Text</TabsTrigger>
                <TabsTrigger className="w-full" value="phone">Phone</TabsTrigger>
              </TabsList>

              {['push', 'text', 'phone'].map((type) => (
                <TabsContent key={type} value={type}>
                  <div className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-start w-full justify-between space-y-4 p-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`${type}-before-input`}>{`Notify before event`}</Label>
                        <Checkbox
                          id={`${type}-before-checkbox`}
                          className="mx-4"
                          checked={field.value[`${type}Before` as keyof NotificationSettingsInput] !== null}
                          onCheckedChange={(checked) => {
                            const updatedNotifications = {
                              ...field.value,
                              [`${type}Before`]: checked ? 0 : null,
                            };
                            field.onChange(updatedNotifications);
                          }}
                        />
                        {field.value[`${type}Before` as keyof NotificationSettingsInput] !== null ? (
                          <>
                            <Input
                              id={`${type}-before-input`}
                              type="number"
                              className="w-14"
                              min={0}
                              max={MAX_NOTIFICATION_EVENT_OFFSET}
                              value={(field.value[`${type}Before` as keyof NotificationSettingsInput] ?? undefined) as number}
                              onChange={(e) => {
                                const updatedNotifications = {
                                  ...field.value,
                                  [`${type}Before`]: Number(e.target.value),
                                };
                                field.onChange(updatedNotifications);
                              }}
                            />
                            <span className="text-sm text-muted-foreground pl-2">minutes</span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`${type}-after-input`}>{`Notify after event`}</Label>
                        <Checkbox
                          id={`${type}-after-checkbox`}
                          className="mx-4"
                          checked={field.value[`${type}After` as keyof NotificationSettingsInput] !== null}
                          onCheckedChange={(checked) => {
                            const updatedNotifications = {
                              ...field.value,
                              [`${type}After`]: checked ? 0 : null,
                            };
                            field.onChange(updatedNotifications);
                          }}
                        />
                        {field.value[`${type}After` as keyof NotificationSettingsInput] !== null ? (
                          <>
                            <Input
                              id={`${type}-after-input`}
                              type="number"
                              className="w-14"
                              min={0}
                              max={MAX_NOTIFICATION_EVENT_OFFSET}
                              value={(field.value[`${type}After` as keyof NotificationSettingsInput] ?? undefined) as number}
                              onChange={(e) => {
                                const updatedNotifications = {
                                  ...field.value,
                                  [`${type}After`]: Number(e.target.value),
                                };
                                field.onChange(updatedNotifications);
                              }}
                            />
                            <span className="text-sm text-muted-foreground pl-2">minutes</span>
                          </>
                        ) : null}
                      </div>
                      {type === 'text' ? (
                        <div className="flex justify-between items-center space-x-3 pt-2">
                          <Label htmlFor={`${type}-checkIn`}>{`Want us to check-in during the event?`}</Label>
                          <Checkbox
                            id={`${type}-checkIn`}
                            checked={(field.value[`${type}CheckIn` as keyof NotificationSettingsInput] as boolean) ?? false}
                            onCheckedChange={(checked) => {
                              const updatedNotifications = {
                                ...field.value,
                                [`${type}CheckIn`]: checked,
                              };
                              field.onChange(updatedNotifications);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </FormControl>
        </FormItem>
      )}
    />
  );
};