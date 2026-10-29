"use client";

import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoredValue } from "@/hooks/use-stored-value";
import { ALLERGEN_ITEMS } from "@/lib/allergy/catalog";
import { ALLERGY_SETTINGS_KEY, NO_ALLERGENS } from "@/lib/allergy/settings";

export function AllergySettings() {
  const [selected, setSelected, hydrated] = useStoredValue(ALLERGY_SETTINGS_KEY, NO_ALLERGENS);

  function toggle(item: string, checked: boolean) {
    setSelected(checked ? [...selected, item] : selected.filter((name) => name !== item));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>아이의 알레르기 항목</CardTitle>
        <CardDescription>
          고른 항목은 이 기기에만 저장되고, 제품을 확인할 때마다 결과에서 해당 항목이 있는지 알려 드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hydrated ? (
          <FieldSet>
            <FieldLegend variant="label">해당하는 항목을 모두 고르세요</FieldLegend>
            <FieldGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ALLERGEN_ITEMS.map((item) => (
                <Field key={item} orientation="horizontal">
                  <Checkbox
                    id={`allergen-${item}`}
                    checked={selected.includes(item)}
                    onCheckedChange={(checked) => toggle(item, checked)}
                  />
                  <FieldLabel htmlFor={`allergen-${item}`}>{item}</FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={() => setSelected(NO_ALLERGENS)} disabled={!hydrated || selected.length === 0}>
          <RotateCcwIcon data-icon="inline-start" />
          선택 모두 해제
        </Button>
        <Link href="/" className={buttonVariants()}>
          확인
        </Link>
      </CardFooter>
    </Card>
  );
}
