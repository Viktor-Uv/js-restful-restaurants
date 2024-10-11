const express = require("express");
const router = express.Router();
const supabaseProvider = require("../provider/supabase");
const flattenObject = require("../utils/flattenObject");

const DB_STARRED_RESTAURANTS = "starred_restaurants";
const DB_RESTAURANTS = "restaurants";

/**
 * Feature 6: Getting the list of all starred restaurants.
 */
router.get("/", async (req, res) => {
    const {data} = await supabaseProvider.from(DB_STARRED_RESTAURANTS).select(`
		id,
		comment,
		restaurants (
			id,
			name
		)
	`);

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

    res.json(starredRestaurant);
});

/**
 * Feature 8: Adding to your list of starred restaurants.
 */
router.post("/", async (req, res) => {
    const {restaurantId} = req.body;

    const restaurant = await findRestaurant(restaurantId);
    if (!restaurant) {
        res.sendStatus(404);
        return;
    }

    const {data, error} = await supabaseProvider.from(DB_STARRED_RESTAURANTS)
        .insert([{restaurantId: restaurantId, comment: null}])
        .select(`
		id,
		comment,
		restaurants (
			id,
			name
		)
	`);

    if (error || data.length !== 1) {
        res.status(400).send({error});
        return;
    }

    res.status(201);
    res.json(flattenObject(data[0]));
});

/**
 * Feature 9: Deleting from your list of starred restaurants.
 */
router.delete("/:id", async (req, res) => {
    const {id} = req.params;

    const {error} = await supabaseProvider.from(DB_STARRED_RESTAURANTS)
        .delete()
        .match({id: id});
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
        .match({id: id});
    if (error) {
        res.status(404).send({error});
        return;
    }

    res.sendStatus(200);
});


const findStarredRestaurant = async id => {
    return await fetchItemFromDatabase(DB_STARRED_RESTAURANTS, id);
}

const findRestaurant = async id => {
    return await fetchItemFromDatabase(DB_RESTAURANTS, id);
}

const fetchItemFromDatabase = async (databaseName, itemId) => {
    const {data} = await supabaseProvider.from(databaseName)
        .select("*")
        .eq("id", itemId);
    return data.length > 0 ? restaurantData[0] : undefined;
}

module.exports = router;
