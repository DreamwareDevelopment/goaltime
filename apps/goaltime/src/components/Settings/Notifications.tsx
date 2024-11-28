import React from 'react';

import { Checkbox } from '@/ui-components/checkbox';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-components/tabs';

import { Goal } from '../GoalSettingsCard';

export interface NotificationSettingsObject {
  before?: number | null;
  after?: number | null;
  checkIn?: boolean | null;
}

export interface PhoneNotificationSettingsObject extends NotificationSettingsObject {
  before?: number | null;
  after?: number | null;
  checkIn?: never;
}

export interface NotificationSettings {
  push: NotificationSettingsObject;
  text: NotificationSettingsObject;
  phone: PhoneNotificationSettingsObject;
}

export const defaultNotificationSettings: NotificationSettings = {
  push: {
    before: 0,
    after: 2,
    checkIn: false,
  },
  text: {
    before: null,
    after: null,
    checkIn: true,
  },
  phone: {
    before: 10,
    after: null,
  },
};

interface NotificationSettingsProps {
  goal: Goal;
  onChange: <T extends keyof Goal>(field: T, value: Goal[T]) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ goal, onChange }) => {
  const handleInputChange = (type: keyof NotificationSettings, field: keyof NotificationSettingsObject, value: number | boolean) => {
    const updatedNotifications = {
      ...goal.notifications,
      [type]: { ...goal.notifications[type], [field]: value },
    };
    onChange('notifications', updatedNotifications);
  };
  const handleCheckboxClick = (type: keyof NotificationSettings, field: keyof NotificationSettingsObject) => {
    const updatedNotifications = {
      ...goal.notifications,
      [type]: { ...goal.notifications[type], [field]: !goal.notifications[type][field] },
    };
    onChange('notifications', updatedNotifications);
  };
  const handleInputCheckboxClick = (type: keyof NotificationSettings, field: keyof NotificationSettingsObject, value: number | null) => {
    const updatedNotifications = {
      ...goal.notifications,
      [type]: { ...goal.notifications[type], [field]: value },
    };
    onChange('notifications', updatedNotifications);
  };

  return (
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
                <Label htmlFor={`${type}-before`}>{`Notify before event`}</Label>
                <Checkbox
                  id={`${type}-before`}
                  className="mx-4"
                  checked={goal.notifications[type as keyof NotificationSettings].before !== null}
                  onCheckedChange={(e) => handleInputCheckboxClick(type as keyof NotificationSettings, 'before', e ? 0 : null)}
                />
                {goal.notifications[type as keyof NotificationSettings].before !== null ? (
                  <>
                    <Input
                      id={`${type}-before`}
                      type="number"
                      className="w-14"
                      value={goal.notifications[type as keyof NotificationSettings].before ?? 0}
                      onChange={(e) => handleInputChange(type as keyof NotificationSettings, 'before', Number(e.target.value))}
                      min={0}
                    />
                    <span className="text-sm text-muted-foreground pl-2">minutes</span>
                  </>
                ) : null}
              </div>
              <div className="flex justify-between items-center">
                <Label htmlFor={`${type}-after`}>{`Notify after event`}</Label>
                <Checkbox
                  id={`${type}-after`}
                  className="mx-4"
                  checked={goal.notifications[type as keyof NotificationSettings].after !== null}
                  onCheckedChange={(e) => handleInputCheckboxClick(type as keyof NotificationSettings, 'after', e ? 0 : null)}
                />
                {goal.notifications[type as keyof NotificationSettings].after !== null ? (
                  <>
                    <Input
                      id={`${type}-after`}
                      type="number"
                      className="w-14"
                      value={goal.notifications[type as keyof NotificationSettings].after ?? 0}
                      onChange={(e) => handleInputChange(type as keyof NotificationSettings, 'after', Number(e.target.value))}
                      min={0}
                    />
                    <span className="text-sm text-muted-foreground pl-2">minutes</span>
                  </>
                ) : null}
              </div>
              {type !== 'phone' ? (
                <div className="flex justify-between items-center space-x-3 pt-2">
                  <Label htmlFor={`${type}-checkIn`}>{`Want us to check-in during the event?`}</Label>
                  <Checkbox
                    id={`${type}-checkIn`}
                    checked={goal.notifications[type as keyof NotificationSettings].checkIn ?? false}
                    onClick={() => handleCheckboxClick(type as keyof NotificationSettings, 'checkIn')}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};