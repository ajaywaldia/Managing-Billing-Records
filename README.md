**Solution**:

Using Azure Table Storage (a NoSQL key-value store inside Azure Storage Accounts), that stores billing records less than 3 months.
And Azure blob storage that stores billing records older than 3 months. That gives us a more cost-effective and simpler route.

	✅ Store active billing records (<3 months) in Azure Table Storage
	✅ Store archived billing records (>3 months) in Azure Blob Storage
	✅ Maintain the same API contract (reads/writes)
	✅ Keep old data immutable (read-only)
	✅ Keep it simple and cost-effective


**Architecture Representation**

                 	     +------------------------------+
                 	     |      Client / API      	    |
                 	     |  (Web, App, Service)         |
                 	     +------------------------------+
                                   	   |
                                       	   v
                  +--------------------------------------------------+
                  |       Azure Function: readBillingRecord          |
                  |         (HTTP Trigger - GET by ID)               |
                  +--------------------------------------------------+
                               	           |
                 +--------------------------------------------------------+
                 |                                               	  |
                 v                         			 	  v
     +------------------------------+   	+-------------------------------------+
     |  Azure Table Storage         |   	|  Azure Blob Storage                 |
     |  (Records < 90 days)         |   	|  (Archived Records > 90 days)       |
     |  Fast Read/Write             |    	|  Read Only                          |
     +------------------------------+   	+-------------------------------------+

                         		   ▲
			                   |
		          +-------------------------------------+
                        | Azure Function: archiveOldRecords   |
                  	  | (Timer Trigger - Daily Job)         |
                	  +-------------------------------------+


**Note**
_This repository contains a initial architectural implementation
The files contains the skeleton code and is not fully running. It require few more implementation._
