import type { z } from 'zod';

export type DataBusPath<TZodData extends z.ZodType = z.ZodUnknown> = {
  /**
   * Path to the data within the databus tree.
   */
  path: string[];

  /**
   * The type of the data, represented by a zod schema.
   */
  type: TZodData;
};
