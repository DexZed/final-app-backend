import express from 'express';
import { ObjectId } from "mongodb";
const donationsRouter = express.Router();

const donationsRoutes = (donationCollection, verifyToken) => {

  donationsRouter.post("/createDonation", verifyToken, async (req, res) => {
    //console.log("POST /api/createDonationRequest", req.body);

    // Destructure required fields from the request body
    const {
      requesterName,
      requesterEmail,
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate,
      donationTime,
      requestMessage,
      donationStatus,
    } = req.body;

    // Validate required fields
    if (
      !requesterName ||
      !requesterEmail ||
      !recipientName ||
      !recipientDistrict ||
      !hospitalName ||
      !bloodGroup ||
      !donationDate ||
      !donationTime ||
      !requestMessage
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields in the donation request." });
    }

    try {
      // Insert donation request into the collection
      const donationRequest = await donationCollection.insertOne({
        requesterName,
        requesterEmail,
        recipientName,
        recipientDistrict,
        recipientUpazila,
        hospitalName,
        fullAddress,
        bloodGroup,
        donationDate: new Date(donationDate), // Store as a Date object
        donationTime,
        requestMessage,
        donationStatus: donationStatus || "pending", // Default status to "pending"
        createdAt: new Date(), // Timestamp when the request was created
      });

      // Respond with the ID of the inserted donation request
      res.status(201).json({ donationId: donationRequest.insertedId });
    } catch (error) {
      //console.error("Error creating donation request:", error);
      res.status(500).json({ message: "Failed to create donation request." });
    }
  });
  // Single donation request by ID
  donationsRouter.get("/getDonationRequestById", verifyToken, async (req, res) => {
    //console.log("GET /api/getDonationRequestById", req.query);

    const { id } = req.query;

    try {
      // Validate ID format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format." });
      }

      // Fetch the donation request by ID
      const donation = await donationCollection.findOne({ _id: new ObjectId(id) });

      if (!donation) {
        return res.status(404).json({ message: "Donation request not found." });
      }

      res.status(200).json(donation);
    } catch (error) {
      //console.error("Error fetching donation request:", error);
      res.status(500).json({ message: "Failed to fetch donation request." });
    }
  });


  // Multiple donation requests (Paginated)
  donationsRouter.get("/getDonationRequests", verifyToken, async (req, res) => {
    //console.log("GET /api/getDonationRequests", req.query);

    const { requesterEmail, recipientDistrict, bloodGroup, status, limit = 10, cursor = 0 } = req.query;

    try {
      // Build query filters dynamically based on query parameters
      const query = {};

      if (requesterEmail) query.requesterEmail = requesterEmail;
      if (recipientDistrict) query.recipientDistrict = recipientDistrict;
      if (bloodGroup) query.bloodGroup = bloodGroup;
      if (status) query.donationStatus = status;

      // Fetch donation requests with pagination (using limit and cursor)
      const donations = await donationCollection
        .find(query)
        .skip(Number(cursor))   // Skip to the appropriate cursor position
        .limit(Number(limit))   // Limit the number of results per page
        .toArray();

      // Fetch next page cursor
      const nextCursor = donations.length === Number(limit) ? Number(cursor) + Number(limit) : null;

      res.status(200).json({
        donations,
        nextCursor,
      });
      //console.log(donations,nextCursor)
    } catch (error) {
      console.error("Error fetching donation requests:", error);
      res.status(500).json({ message: "Failed to fetch donation requests." });
    }
  });


  // PATCH route to update a donation request's status or other fields
  donationsRouter.patch("/updateDonationRequest/:id", verifyToken, async (req, res) => {
    //console.log(`PATCH /api/updateDonationRequest/${req.params.id}`, req.body);

    const { id } = req.params;
    const { donationStatus, ...updateFields } = req.body;

    try {
      // Build the update document
      const updateDoc = {};
      if (donationStatus) updateDoc.donationStatus = donationStatus;
      if (Object.keys(updateFields).length) Object.assign(updateDoc, updateFields);

      if (Object.keys(updateDoc).length === 0) {
        return res.status(400).json({ message: "No fields provided for update." });
      }

      // Update the donation request by ID
      const result = await donationCollection.updateOne(
        { _id: new ObjectId(id) }, // Convert ID to MongoDB ObjectId
        { $set: updateDoc }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Donation request not found." });
      }

      res.status(200).json({ message: "Donation request updated successfully." });
    } catch (error) {
      console.error("Error updating donation request:", error);
      res.status(500).json({ message: "Failed to update donation request." });
    }
  });
  donationsRouter.delete("/deleteDonation/:id", verifyToken, async (req, res) => {
    //console.log("DELETE /api/deleteDonation", req.params);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Donation ID is required." });
    }

    try {
      const result = await donationCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Donation not found or already deleted." });
      }

      res.status(200).json({ message: "Donation deleted successfully." });
    } catch (error) {
      console.error("Error deleting donation:", error);
      res.status(500).json({ message: "Failed to delete donation." });
    }
  });

  donationsRouter.get("/getPaginatedDonation", verifyToken, async (req, res) => {
    //console.log("GET /api/getDonationRequests", req.query);

    // Destructure query parameters for pagination and filtering
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate the number of documents to skip

    // Create the filter object based on the status if provided
    const filter = {};
    if (status && ["pending", "inprogress", "done", "canceled"].includes(status)) {
      filter.donationStatus = status;
    }

    try {
      // Fetch the donations with pagination and filtering
      const donationRequests = await donationCollection
        .find(filter) // Filter by status (if provided)
        .skip(skip) // Skip the number of documents based on the page
        .limit(parseInt(limit)) // Limit the number of donations per page
        .sort({ createdAt: -1 }) // Sort by creation date in descending order (newest first)
        .toArray(); // Convert the result to an array

      // Fetch the total count of matching donations for pagination metadata
      const totalDonations = await donationCollection.countDocuments(filter);

      // Respond with the donation requests and metadata
      res.status(200).json({
        donations: donationRequests,
        totalDonations,
        totalPages: Math.ceil(totalDonations / parseInt(limit)), // Calculate total pages
        currentPage: parseInt(page),
        donationsPerPage: parseInt(limit),
      });
    } catch (error) {
      console.error("Error fetching donation requests:", error);
      res.status(500).json({ message: "Failed to fetch donation requests." });
    }
  });

  return donationsRouter

}

export default donationsRoutes;