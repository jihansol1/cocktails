package com.cocktail.servlets;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.cocktail.database.JDBCConnector;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        JsonObject jsonResponse = new JsonObject();

        // Read JSON body
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        JsonObject jsonRequest = JsonParser.parseString(sb.toString()).getAsJsonObject();
        String username = jsonRequest.get("username").getAsString();
        String email = jsonRequest.get("email").getAsString();
        String password = jsonRequest.get("password").getAsString();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = JDBCConnector.getConnection();

            // Check if username or email already exists
            String checkSql = "SELECT user_id FROM users WHERE username = ? OR email = ?";
            ps = conn.prepareStatement(checkSql);
            ps.setString(1, username);
            ps.setString(2, email);
            rs = ps.executeQuery();

            if (rs.next()) {
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("message", "Username or email already exists");
            } else {
                rs.close();
                ps.close();

                // Insert new user
                String insertSql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
                ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, username);
                ps.setString(2, email);
                ps.setString(3, password);
                ps.executeUpdate();

                rs = ps.getGeneratedKeys();
                if (rs.next()) {
                    jsonResponse.addProperty("success", true);
                    jsonResponse.addProperty("userId", rs.getInt(1));
                    jsonResponse.addProperty("username", username);
                    jsonResponse.addProperty("email", email);
                    jsonResponse.addProperty("message", "Registration successful");
                }
            }

        } catch (SQLException e) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Database error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) rs.close();
                if (ps != null) ps.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }

        out.print(jsonResponse.toString());
    }
}