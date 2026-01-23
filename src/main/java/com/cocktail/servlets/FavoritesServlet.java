package com.cocktail.servlets;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.cocktail.database.JDBCConnector;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/favorites")
public class FavoritesServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    // GET - Retrieve user's favorites
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        JsonObject jsonResponse = new JsonObject();

        String userIdParam = request.getParameter("userId");

        if (userIdParam == null || userIdParam.isEmpty()) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "User ID is required");
            out.print(jsonResponse.toString());
            return;
        }

        int userId = Integer.parseInt(userIdParam);

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = JDBCConnector.getConnection();
            String sql = "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC";
            ps = conn.prepareStatement(sql);
            ps.setInt(1, userId);
            rs = ps.executeQuery();

            JsonArray favoritesArray = new JsonArray();

            while (rs.next()) {
                JsonObject drink = new JsonObject();
                drink.addProperty("favoriteId", rs.getInt("favorite_id"));
                drink.addProperty("drinkId", rs.getString("drink_id"));
                drink.addProperty("drinkName", rs.getString("drink_name"));
                drink.addProperty("drinkCategory", rs.getString("drink_category"));
                drink.addProperty("drinkImage", rs.getString("drink_image"));
                drink.addProperty("glassType", rs.getString("glass_type"));
                drink.addProperty("isAlcoholic", rs.getString("is_alcoholic"));
                drink.addProperty("ingredientCount", rs.getInt("ingredient_count"));
                drink.addProperty("baseSpirit", rs.getString("base_spirit"));
                favoritesArray.add(drink);
            }

            jsonResponse.addProperty("success", true);
            jsonResponse.add("favorites", favoritesArray);

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

    // POST - Add to favorites
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

        int userId = jsonRequest.get("userId").getAsInt();
        String drinkId = jsonRequest.get("drinkId").getAsString();
        String drinkName = jsonRequest.get("drinkName").getAsString();
        String drinkCategory = jsonRequest.has("drinkCategory") ? jsonRequest.get("drinkCategory").getAsString() : null;
        String drinkImage = jsonRequest.has("drinkImage") ? jsonRequest.get("drinkImage").getAsString() : null;
        String glassType = jsonRequest.has("glassType") ? jsonRequest.get("glassType").getAsString() : null;
        String isAlcoholic = jsonRequest.has("isAlcoholic") ? jsonRequest.get("isAlcoholic").getAsString() : null;
        int ingredientCount = jsonRequest.has("ingredientCount") ? jsonRequest.get("ingredientCount").getAsInt() : 0;
        String baseSpirit = jsonRequest.has("baseSpirit") ? jsonRequest.get("baseSpirit").getAsString() : null;

        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = JDBCConnector.getConnection();

            String sql = "INSERT INTO favorites (user_id, drink_id, drink_name, drink_category, drink_image, " +
                    "glass_type, is_alcoholic, ingredient_count, base_spirit) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

            ps = conn.prepareStatement(sql);
            ps.setInt(1, userId);
            ps.setString(2, drinkId);
            ps.setString(3, drinkName);
            ps.setString(4, drinkCategory);
            ps.setString(5, drinkImage);
            ps.setString(6, glassType);
            ps.setString(7, isAlcoholic);
            ps.setInt(8, ingredientCount);
            ps.setString(9, baseSpirit);

            ps.executeUpdate();

            jsonResponse.addProperty("success", true);
            jsonResponse.addProperty("message", "Added to favorites");

        } catch (SQLException e) {
            if (e.getMessage().contains("Duplicate")) {
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("message", "Already in favorites");
            } else {
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("message", "Database error: " + e.getMessage());
            }
            e.printStackTrace();
        } finally {
            try {
                if (ps != null) ps.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }

        out.print(jsonResponse.toString());
    }

    // DELETE - Remove from favorites
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        JsonObject jsonResponse = new JsonObject();

        String userIdParam = request.getParameter("userId");
        String drinkIdParam = request.getParameter("drinkId");

        if (userIdParam == null || drinkIdParam == null) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "User ID and Drink ID are required");
            out.print(jsonResponse.toString());
            return;
        }

        int userId = Integer.parseInt(userIdParam);
        String drinkId = drinkIdParam;

        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = JDBCConnector.getConnection();
            String sql = "DELETE FROM favorites WHERE user_id = ? AND drink_id = ?";
            ps = conn.prepareStatement(sql);
            ps.setInt(1, userId);
            ps.setString(2, drinkId);

            int rowsAffected = ps.executeUpdate();

            if (rowsAffected > 0) {
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("message", "Removed from favorites");
            } else {
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("message", "Drink not found in favorites");
            }

        } catch (SQLException e) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Database error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            try {
                if (ps != null) ps.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }

        out.print(jsonResponse.toString());
    }
}