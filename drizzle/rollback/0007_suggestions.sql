-- Reverts 0007_suggestions. Every suggestion sent by visitors is lost: back up first.
DROP TABLE IF EXISTS "suggestions";
