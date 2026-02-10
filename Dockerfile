# Use official Tomcat 10 with JDK 17
FROM tomcat:10.1-jdk17

# Remove default Tomcat webapps
RUN rm -rf /usr/local/tomcat/webapps/*

# Copy WAR file as ROOT.war so app runs at /
COPY target/cocktail-1.0-SNAPSHOT.war /usr/local/tomcat/webapps/ROOT.war

# Expose port 8080 (Tomcat default inside container)
EXPOSE 8081

# Start Tomcat
CMD ["catalina.sh", "run"]