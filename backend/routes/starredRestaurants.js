const express = require("express");
const router = express.Router();
const supabaseProvider = require("../provider/supabase");
const flattenObject = require("../utils/flattenObject");

const DB_STARRED_RESTAURANTS = "starred_restaurants";
const DB_RESTAURANTS = "restaurants";
const SELECT_STARRED_RESTAURANTS_QUERY = "id, comment, restaurants(*)";
const SELECT_ALL_ROWS_QUERY = "*";

/**
 * Feature 6: Getting the list of all starred restaurants.
 */
router.get("/", async (req, res) => {
    const {data} = await supabaseProvider.from(DB_STARRED_RESTAURANTS)
        .select(SELECT_STARRED_RESTAURANTS_QUERY);

    // Flatten the data. We are doing this because the database will return a nested structure.
    // For demo purposes, we change the structure to make it easier to handle on the frontend.
    const flattenedData = data.map((record) => flattenObject(record));

    res.json(flattenedData);
});

/**
 * Feature 7: Getting a specific starred restaurant.
 */
router.get("/:id", async (req, res) => {
    const {id} = req.params;

    const starredRestaurant = await findStarredRestaurant(id);
    if (!starredRestaurant) {
        res.sendStatus(404);
        return;
    }

    res.json(flattenObject(starredRestaurant));
});

/**
 * Feature 8: Adding to your list of starred restaurants.
 */
router.post("/", async (req, res) => {
    const {id: restaurantId} = req.body;

    const restaurant = await findRestaurant(restaurantId);
    if (!restaurant) {
        res.sendStatus(404);
        return;
    }

    const {data: item, error} = await supabaseProvider.from(DB_STARRED_RESTAURANTS)
        .insert([{restaurantId: restaurantId, comment: null}])
        .select(SELECT_STARRED_RESTAURANTS_QUERY)
        .maybeSingle();

    if (error || !item) {
        res.status(400).send({error});
        return;
    }

    res.status(201);
    res.json(flattenObject(item));
});

/**
 * Feature 9: Deleting from your list of starred restaurants.
 */
router.delete("/:id", async (req, res) => {
    const {id} = req.params;

    const {error} = await supabaseProvider.from(DB_STARRED_RESTAURANTS)
        .delete()
        .eq("id", id);
    if (error) {
        res.status(404).send({error});
        return;
    }

    res.sendStatus(204);
});

/**
 * Feature 10: Updating your comment of a starred restaurant.
 */
router.put("/:id", async (req, res) => {
    const {id} = req.params;
    const {newComment} = req.body;

    const {error} = await supabaseProvider.from(DB_STARRED_RESTAURANTS)
        .update({comment: newComment})
        .eq("id", id);
    if (error) {
        res.status(404).send({error});
        return;
    }

    res.sendStatus(200);
});

const findStarredRestaurant = async id => {
    return await fetchItemFromDatabase(DB_STARRED_RESTAURANTS, SELECT_STARRED_RESTAURANTS_QUERY, id);
}

const findRestaurant = async id => {
    return await fetchItemFromDatabase(DB_RESTAURANTS, SELECT_ALL_ROWS_QUERY, id);
}

const fetchItemFromDatabase = async (databaseName, selectQuery, itemId) => {
    const {data: item, error} = await supabaseProvider.from(databaseName)
        .select(selectQuery)
        .eq("id", itemId)
        .maybeSingle();
    if (error || !item) {
        return undefined;
    }
    return item;
}

module.exports = router;
