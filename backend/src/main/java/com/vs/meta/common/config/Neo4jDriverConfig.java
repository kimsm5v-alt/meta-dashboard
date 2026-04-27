package com.vs.meta.common.config;

import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class Neo4jDriverConfig {

    @Bean
    public Driver neo4jDriver(
            @Value("${neo4j.uri}") String uri,
            @Value("${neo4j.username}") String username,
            @Value("${neo4j.password}") String password
    ) {
        Driver driver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        try {
            driver.verifyConnectivity();
            log.info("Neo4j connectivity check succeeded.");
            return driver;
        } catch (Exception e) {
            log.error("Neo4j connectivity check failed.", e);
            try {
                driver.close();
            } catch (Exception closeEx) {
                log.warn("Failed to close Neo4j driver after connectivity failure.", closeEx);
            }
            throw e;
        }
    }
}

