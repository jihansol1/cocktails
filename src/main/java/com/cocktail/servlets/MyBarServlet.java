package com.cocktail.servlets;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.cocktail.database.JDBCConnector;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


public class MyBarServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

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
            String sql = "SELECT * FROM favorites WHERE user_id = ?";
            ps = conn.prepareStatement(sql);
            ps.setInt(1, userId);
            rs = ps.executeQuery();

            // Stats
            int totalDrinks = 0;
            int alcoholicCount = 0;
            int nonAlcoholicCount = 0;
            int totalIngredients = 0;

            // Breakdowns
            Map<String, Integer> categoryBreakdown = new HashMap<>();
            Map<String, Integer> baseSpiritBreakdown = new HashMap<>();
            Map<String, Integer> glassBreakdown = new HashMap<>();

            // Drinks list
            JsonArray drinksArray = new JsonArray();

            while (rs.next()) {
                totalDrinks++;

                String isAlcoholic = rs.getString("is_alcoholic");
                if ("Alcoholic".equalsIgnoreCase(isAlcoholic)) {
                    alcoholicCount++;
                } else {
                    nonAlcoholicCount++;
                }

                int ingredientCount = rs.getInt("ingredient_count");
                totalIngredients += ingredientCount;

                // Category breakdown
                String category = rs.getString("drink_category");
                if (category != null) {
                    categoryBreakdown.put(category, categoryBreakdown.getOrDefault(category, 0) + 1);
                }

                // Base spirit breakdown
                String baseSpirit = rs.getString("base_spirit");
                if (baseSpirit != null && !baseSpirit.isEmpty()) {
                    baseSpiritBreakdown.put(baseSpirit, baseSpiritBreakdown.getOrDefault(baseSpirit, 0) + 1);
                }

                // Glass breakdown
                String glass = rs.getString("glass_type");
                if (glass != null) {
                    glassBreakdown.put(glass, glassBreakdown.getOrDefault(glass, 0) + 1);
                }

                // Add drink to array
                JsonObject drink = new JsonObject();
                drink.addProperty("drinkId", rs.getString("drink_id"));
                drink.addProperty("drinkName", rs.getString("drink_name"));
                drink.addProperty("drinkCategory", category);
                drink.addProperty("drinkImage", rs.getString("drink_image"));
                drink.addProperty("glassType", glass);
                drink.addProperty("isAlcoholic", isAlcoholic);
                drink.addProperty("ingredientCount", ingredientCount);
                drink.addProperty("baseSpirit", baseSpirit);
                drinksArray.add(drink);
            }

            // Build response
            jsonResponse.addProperty("success", true);

            // Stats object
            JsonObject stats = new JsonObject();
            stats.addProperty("totalDrinks", totalDrinks);
            stats.addProperty("alcoholicCount", alcoholicCount);
            stats.addProperty("nonAlcoholicCount", nonAlcoholicCount);
            stats.addProperty("avgIngredientCount", totalDrinks > 0 ?
                    Math.round((double) totalIngredients / totalDrinks * 10.0) / 10.0 : 0);
            jsonResponse.add("stats", stats);

            // Category breakdown
            JsonObject categoryJson = new JsonObject();
            for (Map.Entry<String, Integer> entry : categoryBreakdown.entrySet()) {
                categoryJson.addProperty(entry.getKey(), entry.getValue());
            }
            jsonResponse.add("categoryBreakdown", categoryJson);

            // Base spirit breakdown
            JsonObject spiritJson = new JsonObject();
            for (Map.Entry<String, Integer> entry : baseSpiritBreakdown.entrySet()) {
                spiritJson.addProperty(entry.getKey(), entry.getValue());
            }
            jsonResponse.add("baseSpiritBreakdown", spiritJson);

            // Glass breakdown
            JsonObject glassJson = new JsonObject();
            for (Map.Entry<String, Integer> entry : glassBreakdown.entrySet()) {
                glassJson.addProperty(entry.getKey(), entry.getValue());
            }
            jsonResponse.add("glassBreakdown", glassJson);

            // Drinks list
            jsonResponse.add("drinks", drinksArray);

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