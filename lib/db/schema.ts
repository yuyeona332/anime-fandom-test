/**
 * Active-mode schema shim.
 *
 * Re-exports either pg-core or sqlite-core tables based on runtime mode.
 * Type information is anchored on the pg-core schema (production source
 * of truth); the sqlite-core schema is cast to the same shape so business
 * logic does not need dialect-aware imports.
 *
 * This relies on the two schemas keeping structurally identical column
 * names, enums, and table names — see [[../README.md]] schema drift note.
 */

import * as pg from "./schema-pg";
import * as sqlite from "./schema-sqlite";
import { isLocal } from "@/lib/runtime/mode";

const active = (isLocal() ? sqlite : pg) as unknown as typeof pg;

export const users = active.users;
export const missions = active.missions;
export const missionAssignments = active.missionAssignments;
export const missionLogs = active.missionLogs;
export const riskEvents = active.riskEvents;
export const auditLog = active.auditLog;

export const missionLevelEnum = pg.missionLevelEnum;
export const missionResponseEnum = pg.missionResponseEnum;
export const missionStatusEnum = pg.missionStatusEnum;
export const riskActionEnum = pg.riskActionEnum;

export type User = pg.User;
export type NewUser = pg.NewUser;
export type Mission = pg.Mission;
export type MissionAssignment = pg.MissionAssignment;
export type MissionLog = pg.MissionLog;
export type RiskEvent = pg.RiskEvent;
export type AuditLogEntry = pg.AuditLogEntry;
