Solution:

Using Azure Table Storage (a NoSQL key-value store inside Azure Storage Accounts), that stores billing records less than 3 months.
And Azure blob storage that stores billing records older than 3 months. That gives us a more cost-effective and simpler route.

 Revised Solution Using Azure Table Storage (and Azure Blob for Archival)
You want to:

✅ Store active billing records (<3 months) in Azure Table Storage

✅ Store archived billing records (>3 months) in Azure Blob Storage

✅ Avoid Cosmos DB entirely

✅ Maintain the same API contract (reads/writes)

✅ Keep old data immutable (read-only)

✅ Keep it simple and cost-effective


Architecture Representation
                 	     +------------------------------+
                 	     |      Client / API      	    |
                 	     |  (Web, App, Service)    |
                 	     +-----------------------------+
                                   	        |
                                       	       v
                  +--------------------------------------------------+
                  | Azure Function: readBillingRecord      |
                  |  (HTTP Trigger - GET by ID)                |
                  +----------------+--------------------------------+
                               	        	|
                 +------------------------+-------------------------+
                 |                                               		|
                 v                         			 		v
     +------------------------------+   		+-------------------------------------+
     |  Azure Table Storage    |   		|  Azure Blob Storage             |
     |  (Records < 90 days)    |   		|  (Archived Records > 90 d)  |
     |  Fast Read/Write          |   		|  Cold Access - Read Only    |
     +------------------------------+   		+-------------------------------------+

                         		     	    ▲
			                             |
		          +-------------------------------------------------+
                          | Azure Function: archiveOldRecords   |
                  	  | (Timer Trigger - Daily Job)       		|
                	  +-------------------------------------------------+
