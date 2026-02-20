import { z } from "zod";

export const createOrderSchema = z.object({
    retailerId: z.string().cuid(),
    merchandiserId: z.string().cuid(),
    items: z.array(
        z.object({
            inventoryBatchId: z.string().cuid(),
            quantity: z.number().int().positive(),
        })
    ).min(1),
});
