package com.cocktail.database;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class JDBCConnector {
    private static String URL;
    private static String USER;
    private static String PASSWORD;
    private static boolean initialized = false;
    private static String initError = null;

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");

            Properties props = new Properties();
            InputStream input = null;

            // Try environment variables first (best for Docker/AWS)
            String envUrl = System.getenv("DB_URL");
            String envUser = System.getenv("DB_USER");
            String envPassword = System.getenv("DB_PASSWORD");

            if (envUrl != null && envUser != null && envPassword != null) {
                URL = envUrl;
                USER = envUser;
                PASSWORD = envPassword;
                initialized = true;
                System.out.println("Database config loaded from environment variables");
            } else {
                // Fallback to properties file
                // Try Tomcat lib folder first (Docker)
                File tomcatProps = new File("/usr/local/tomcat/lib/db.properties");
                if (tomcatProps.exists()) {
                    input = new FileInputStream(tomcatProps);
                } else {
                    // Try classpath (local development)
                    input = JDBCConnector.class.getClassLoader()
                            .getResourceAsStream("db.properties");
                }

                if (input != null) {
                    props.load(input);
                    URL = props.getProperty("db.url");
                    USER = props.getProperty("db.user");
                    PASSWORD = props.getProperty("db.password");
                    input.close();
                    initialized = true;
                    System.out.println("Database config loaded from properties file");
                } else {
                    initError = "No database configuration found";
                    System.err.println("ERROR: " + initError);
                }
            }

            if (initialized) {
                System.out.println("DB URL: " + URL);
                System.out.println("DB USER: " + USER);
            }

        } catch (Exception e) {
            initError = "Failed to load database config: " + e.getMessage();
            System.err.println("ERROR: " + initError);
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        if (!initialized) {
            throw new SQLException("Database not initialized: " + initError);
        }
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}