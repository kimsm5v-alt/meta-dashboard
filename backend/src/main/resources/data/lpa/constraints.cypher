// LPA Graph DB - Constraints
// Run before importing lpa_graph_all_merge_safe.cypher

// Core node uniqueness
CREATE CONSTRAINT lpa_class_unique IF NOT EXISTS
FOR (n:LPAClass) REQUIRE (n.school_level, n.id) IS UNIQUE;

CREATE CONSTRAINT factor_unique IF NOT EXISTS
FOR (n:Factor) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT outcome_unique IF NOT EXISTS
FOR (n:Outcome) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT mediation_unique IF NOT EXISTS
FOR (n:MediationPath) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT moderation_unique IF NOT EXISTS
FOR (n:ModerationPath) REQUIRE n.id IS UNIQUE;

// Optional check
// SHOW CONSTRAINTS;
