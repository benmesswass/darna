/**
 * Tests — scan des coordonnées dans les messages (anti-bypass).
 * Les numéros, e-mails et apps de contournement sont masqués ; les mots métier
 * légitimes (« cash », « solde à l'arrivée ») restent intacts.
 */
import { describe, expect, it } from "vitest";
import { scanForContactInfo, CONTACT_MASK } from "@/lib/message-scan";

describe("scanForContactInfo", () => {
  it("masque un numéro tunisien (8 chiffres) et flague", () => {
    const r = scanForContactInfo("Appelle-moi au 20123456 stp");
    expect(r.flagged).toBe(true);
    expect(r.clean).toContain(CONTACT_MASK);
    expect(r.clean).not.toContain("20123456");
  });

  it("masque un numéro international espacé (+216 …)", () => {
    const r = scanForContactInfo("mon num +216 20 123 456");
    expect(r.flagged).toBe(true);
    expect(r.clean).not.toMatch(/\d{2}\s?\d{2}\s?\d{2}/);
  });

  it("masque un e-mail", () => {
    const r = scanForContactInfo("écris à wassim.test@gmail.com");
    expect(r.flagged).toBe(true);
    expect(r.clean).not.toContain("@gmail.com");
  });

  it("masque les apps de contournement (WhatsApp)", () => {
    const r = scanForContactInfo("on continue sur WhatsApp ?");
    expect(r.flagged).toBe(true);
    expect(r.clean.toLowerCase()).not.toContain("whatsapp");
  });

  it("NE masque PAS un message normal (cash à l'arrivée reste métier)", () => {
    const msg = "Parfait, je règle le solde en cash à l'arrivée. À bientôt !";
    const r = scanForContactInfo(msg);
    expect(r.flagged).toBe(false);
    expect(r.clean).toBe(msg);
  });

  it("ne confond pas un petit nombre (2 voyageurs, 4 nuits) avec un numéro", () => {
    const r = scanForContactInfo("Nous serons 2 voyageurs pour 4 nuits");
    expect(r.flagged).toBe(false);
  });

  it("masque les graphies arabizi d'apps (watsab, tlgrm)", () => {
    expect(scanForContactInfo("ja3ml watsab w nahkiw").clean).not.toMatch(/watsab/i);
    expect(scanForContactInfo("ajoute moi sur tlgrm").flagged).toBe(true);
  });

  it("FLAGUE sans masquer une sollicitation derja (kalamni f telifoun)", () => {
    const msg = "kalamni f telifoun";
    const r = scanForContactInfo(msg);
    expect(r.flagged).toBe(true);
    expect(r.clean).toBe(msg); // le texte n'est pas mutilé
  });

  it("FLAGUE les sollicitations (a3tini raqmek, appelle-moi)", () => {
    expect(scanForContactInfo("a3tini raqmek").flagged).toBe(true);
    expect(scanForContactInfo("appelle-moi ce soir").flagged).toBe(true);
  });

  it("masque le numéro ET flague même quand la sollicitation est en derja", () => {
    const r = scanForContactInfo("3aytili 3al 20123456");
    expect(r.flagged).toBe(true);
    expect(r.clean).not.toContain("20123456");
  });
});
