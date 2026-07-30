/**
 * P5.5 (ROADMAP.md) — gate CI migrations destructives. Ne teste que la
 * logique pure exportée (mots-clés, label) ; la plomberie git/CLI de
 * scripts/check-destructive-migrations.mjs est vérifiée manuellement (même
 * convention que les autres scripts de scripts/, aucun n'a de test unitaire
 * de sa partie CLI — voir la PR pour la vérification manuelle en conditions
 * réelles).
 */
import { describe, expect, it } from "vitest";
import {
  APPROVAL_LABEL,
  findDestructiveStatements,
  hasApprovalLabel,
} from "../scripts/check-destructive-migrations.mjs";

describe("findDestructiveStatements", () => {
  it("détecte DROP TABLE", () => {
    expect(findDestructiveStatements('DROP TABLE "Foo";')).toEqual(['DROP TABLE "Foo";']);
  });

  it("détecte DROP COLUMN", () => {
    expect(findDestructiveStatements('ALTER TABLE "User" DROP COLUMN "foo";')).toEqual([
      'ALTER TABLE "User" DROP COLUMN "foo";',
    ]);
  });

  it("détecte DROP DATABASE et DROP SCHEMA", () => {
    expect(findDestructiveStatements("DROP DATABASE foo;")).toHaveLength(1);
    expect(findDestructiveStatements("DROP SCHEMA foo;")).toHaveLength(1);
  });

  it("détecte TRUNCATE", () => {
    expect(findDestructiveStatements('TRUNCATE "Foo";')).toHaveLength(1);
  });

  it("détecte ALTER COLUMN (y compris un simple SET NOT NULL)", () => {
    expect(
      findDestructiveStatements('ALTER TABLE "User" ALTER COLUMN "foo" SET NOT NULL;')
    ).toHaveLength(1);
  });

  it("est insensible à la casse", () => {
    expect(findDestructiveStatements('drop table "Foo";')).toHaveLength(1);
  });

  it("ignore les lignes de commentaire SQL même si elles évoquent un mot-clé", () => {
    expect(findDestructiveStatements('-- ancienne version utilisait DROP TABLE ici')).toEqual([]);
  });

  it("ne déclenche pas sur un identifiant contenant un mot-clé comme sous-chaîne", () => {
    expect(
      findDestructiveStatements('ALTER TABLE "User" ADD COLUMN "drop_column_flag" BOOLEAN;')
    ).toEqual([]);
  });

  it("ne déclenche pas sur un ADD COLUMN normal", () => {
    expect(findDestructiveStatements('ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);')).toEqual(
      []
    );
  });

  it("ne déclenche pas sur un CREATE TABLE", () => {
    const sql = `CREATE TABLE "AuditChainState" (
    "id" TEXT NOT NULL,
    "lastHash" TEXT NOT NULL,
    CONSTRAINT "AuditChainState_pkey" PRIMARY KEY ("id")
);`;
    expect(findDestructiveStatements(sql)).toEqual([]);
  });

  it("retourne un hit par ligne destructive, plusieurs si le fichier en contient plusieurs", () => {
    const sql = `ALTER TABLE "User" DROP COLUMN "foo";\nDROP TABLE "Bar";`;
    expect(findDestructiveStatements(sql)).toHaveLength(2);
  });

  it("contenu réel non destructif (migration add_audit_hash_chain) : aucun hit", () => {
    const sql = `-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "prevHash" TEXT;

-- CreateTable
CREATE TABLE "AuditChainState" (
    "id" TEXT NOT NULL,
    "lastHash" TEXT NOT NULL,

    CONSTRAINT "AuditChainState_pkey" PRIMARY KEY ("id")
);`;
    expect(findDestructiveStatements(sql)).toEqual([]);
  });
});

describe("hasApprovalLabel", () => {
  it("retourne false quand la valeur est undefined", () => {
    expect(hasApprovalLabel(undefined)).toBe(false);
  });

  it("retourne false quand la chaîne est vide", () => {
    expect(hasApprovalLabel("")).toBe(false);
  });

  it("retourne false quand le label n'y est pas", () => {
    expect(hasApprovalLabel("bug,docs")).toBe(false);
  });

  it("retourne true quand le label est présent", () => {
    expect(hasApprovalLabel(`bug,${APPROVAL_LABEL},docs`)).toBe(true);
  });

  it("tolère les espaces autour des noms de label", () => {
    expect(hasApprovalLabel(`bug, ${APPROVAL_LABEL} , docs`)).toBe(true);
  });
});
