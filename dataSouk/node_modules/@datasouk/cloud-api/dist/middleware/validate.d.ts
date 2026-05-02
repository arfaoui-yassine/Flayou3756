import { z } from 'zod';
export declare const ingestBodySchema: z.ZodObject<{
    events: z.ZodArray<z.ZodDiscriminatedUnion<"event_type", [z.ZodObject<{
        event_type: z.ZodLiteral<"sale">;
        commerce_hash: z.ZodString;
        wilaya: z.ZodString;
        type_commerce: z.ZodEnum<["epicerie", "cafe", "restaurant", "retail", "autre"]>;
        heure: z.ZodNumber;
        jour_semaine: z.ZodNumber;
        categories: z.ZodArray<z.ZodString, "many">;
        montant_tranche: z.ZodEnum<["<5", "5-10", "10-20", "20-50", "50-100", ">100"]>;
        nb_articles: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        event_type: "sale";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        heure: number;
        jour_semaine: number;
        categories: string[];
        montant_tranche: "<5" | "5-10" | "10-20" | "20-50" | "50-100" | ">100";
        nb_articles: number;
    }, {
        event_type: "sale";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        heure: number;
        jour_semaine: number;
        categories: string[];
        montant_tranche: "<5" | "5-10" | "10-20" | "20-50" | "50-100" | ">100";
        nb_articles: number;
    }>, z.ZodObject<{
        event_type: z.ZodLiteral<"stock_low">;
        commerce_hash: z.ZodString;
        wilaya: z.ZodString;
        type_commerce: z.ZodEnum<["epicerie", "cafe", "restaurant", "retail", "autre"]>;
        category: z.ZodString;
        current_stock: z.ZodNumber;
        threshold: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        event_type: "stock_low";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        category: string;
        current_stock: number;
        threshold: number;
    }, {
        event_type: "stock_low";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        category: string;
        current_stock: number;
        threshold: number;
    }>]>, "many">;
    agent_version: z.ZodString;
    sent_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    events: ({
        event_type: "sale";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        heure: number;
        jour_semaine: number;
        categories: string[];
        montant_tranche: "<5" | "5-10" | "10-20" | "20-50" | "50-100" | ">100";
        nb_articles: number;
    } | {
        event_type: "stock_low";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        category: string;
        current_stock: number;
        threshold: number;
    })[];
    agent_version: string;
    sent_at: string;
}, {
    events: ({
        event_type: "sale";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        heure: number;
        jour_semaine: number;
        categories: string[];
        montant_tranche: "<5" | "5-10" | "10-20" | "20-50" | "50-100" | ">100";
        nb_articles: number;
    } | {
        event_type: "stock_low";
        commerce_hash: string;
        wilaya: string;
        type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
        category: string;
        current_stock: number;
        threshold: number;
    })[];
    agent_version: string;
    sent_at: string;
}>;
export type IngestBody = z.infer<typeof ingestBodySchema>;
export declare const registerBodySchema: z.ZodObject<{
    commerce_hash: z.ZodString;
    wilaya: z.ZodString;
    type_commerce: z.ZodEnum<["epicerie", "cafe", "restaurant", "retail", "autre"]>;
}, "strip", z.ZodTypeAny, {
    commerce_hash: string;
    wilaya: string;
    type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
}, {
    commerce_hash: string;
    wilaya: string;
    type_commerce: "epicerie" | "cafe" | "restaurant" | "retail" | "autre";
}>;
//# sourceMappingURL=validate.d.ts.map