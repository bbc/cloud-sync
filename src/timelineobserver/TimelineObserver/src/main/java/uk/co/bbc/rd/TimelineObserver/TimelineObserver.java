package uk.co.bbc.rd.TimelineObserver;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Date;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.logging.ConsoleHandler;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

import com.nurkiewicz.asyncretry.AsyncRetryExecutor;
import com.nurkiewicz.asyncretry.RetryExecutor;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;




public class TimelineObserver 
{
	/* Logger */
	private static Logger logger = null;
	
	static {
	      Logger mainLogger = Logger.getLogger("uk.co.bbc.rd.TimelineObserver");
	      mainLogger.setUseParentHandlers(false);
	      ConsoleHandler handler = new ConsoleHandler();
	      handler.setFormatter(new SimpleFormatter() {
	          private static final String format = "[%1$tF %1$tT] [%2$-7s] %3$s %n";

	          @Override
	          public synchronized String format(LogRecord lr) {
	              return String.format(format,
	                      new Date(lr.getMillis()),
	                      lr.getLevel().getLocalizedName(),
	                      lr.getMessage()
	              );
	          }
	      });
//	      mainLogger.addHandler(handler);
	      logger = Logger.getLogger(TimelineObserver.class.getName());
	}
	
	private String brokerServiceName;
	private int brokerPort;
	private InetAddress brokerServiceAddr;
	private List<String> brokerTopics;
	
	private String dbServiceName;
	private int dbServicePort; 
	private InetAddress dbServiceAddr;
	private BlockingQueue<Observation> internalQueue;
	
	private JedisPool jedisPool;
	
	private String servicesHost;
// //redis-smq-default|@1.1|cloudsync_synccontroller_waitqueue
// 	private final static String SYNC_CONTROLLER_WAITQUEUE = "redis-smq-default|@1.1|cloudsync_synccontroller_waitQueue";

	private final static String SYNC_CONTROLLER_WAITQUEUE = "redis-smq-default-ns|@1.1|cloudsync_synccontroller_waitQueue";
	//redis-smq-default-ns|@1.1|cloudsync_synccontroller_waitQueue
	//redis-smq-default|@1.1|cloudsync_synccontroller_waitQueue
	
	private final static int NUM_WRITER_THREADS= 5;

	// ---------------------------------------------------------------------------------------------------
	/**
	 * Constructor
	 * @param brokerServiceName broker service name
	 * @param dbServiceName database service name
	 * @param brokerTopics list of topic names/filters to read messages from
	 */
	public TimelineObserver(String brokerName, int brokerPort, String dbServiceName, int dbServicePort, List<String> brokerTopics) {
		super();
		this.brokerServiceName = brokerName;
		this.brokerPort = brokerPort;
		this.dbServiceName = dbServiceName;
		this.dbServicePort = dbServicePort;
		this.brokerTopics = brokerTopics;
		this.internalQueue = new LinkedBlockingQueue<>();
	}
	
	
	public TimelineObserver(String brokerName, int brokerPort, String dbServiceName, int dbServicePort, List<String> brokerTopics, String servicesHostAddr) {
		super();
		this.brokerServiceName = brokerName;
		this.brokerPort = brokerPort;
		this.dbServiceName = dbServiceName;
		this.dbServicePort = dbServicePort;
		this.brokerTopics = brokerTopics;
		this.internalQueue = new LinkedBlockingQueue<>();
		this.servicesHost = servicesHostAddr;
	}
	
	
	// ---------------------------------------------------------------------------------------------------


	
	// ---------------------------------------------------------------------------------------------------
	
	/**
	 * Discover a service endpoint from DNS in an async manner; supports retries
	 * @param serviceName
	 * @return service endpoint address
	 * @throws TimelineObserverException
	 */
	public InetAddress discoverService(String serviceName) throws TimelineObserverException
	{
		InetAddress serviceAddress = null;

		try {
			InetAddress[] serviceAddresses = InetAddress.getAllByName(serviceName);

			if (serviceAddresses.length > 0)
			{
				serviceAddress =  serviceAddresses[0];
			}
			
			return serviceAddress;
			
		} catch (Exception e) {

			if (e instanceof UnknownHostException)
			{
				throw new TimelineObserverException(TimelineObserverException.SERVICE_NOT_FOUND, "Service " + serviceName + " not found." );
			}
			else
			{
				logger.warning("Error on service DNS lookup for " + serviceName + ": " + e.getMessage());
				return serviceAddress;
			}
		}
	}

	// ---------------------------------------------------------------------------------------------------
	
	/**
	 * Asynchronous discovery operation
	 * @param serviceName
	 * @return a {@link CompletableFuture} object
	 */
	public CompletableFuture<InetAddress> discoverServiceAsync(String serviceName) 
	{
		ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
		RetryExecutor executor = new AsyncRetryExecutor(scheduler).
				retryOn(TimelineObserverException.class).
				withExponentialBackoff(500, 1).     //500ms times 2 after each retry
				withMaxDelay(10_000).               //10 seconds
				withUniformJitter().                //add between +/- 100 ms randomly
				withMaxRetries(20);

		return executor.getWithRetry(() ->discoverService(serviceName));
	}
	
	// ---------------------------------------------------------------------------------------------------
	

	/**
	 * 
	 * @param serviceRegistry
	 * @param dbServiceName
	 * @param brokerServiceName
	 * @param sourceChannels
	 */
	public void start()
	{
		try {

			// discover service endpoints
		ExecutorService exec = Executors.newCachedThreadPool();

		CompletableFuture<InetAddress> msgBrokerDiscoveryFuture = discoverServiceAsync(this.brokerServiceName);

		CompletableFuture<InetAddress> dbDiscoveryFuture = msgBrokerDiscoveryFuture.thenComposeAsync((brokerAddr)->{
			
			this.brokerServiceAddr = brokerAddr;
			if (brokerAddr != null)
			{
				logger.info("Resolved " + this.brokerServiceName + " service: " +  this.brokerServiceAddr.getHostAddress() + ":" + brokerPort);
			}
			else
			{
				logger.warning("Error discovering broker endpoint.");
			}
						
			return discoverServiceAsync(dbServiceName);						
		}, exec);


		CompletableFuture<Void> startFuture = dbDiscoveryFuture.thenAcceptAsync((redisAddr)->{

			this.dbServiceAddr = redisAddr;

			if (redisAddr !=null)
			{
				logger.info("Resolved " + dbServiceName + " service: " +  dbServiceAddr.getHostAddress() + ":" + dbServicePort);
			
				jedisPool = new JedisPool( servicesHost !=null ? servicesHost : this.dbServiceAddr.getHostAddress(), dbServicePort);
				
				logger.info("DB client connection setup... done.");
				Jedis redisClient = jedisPool.getResource();
	
				ExecutorService executorService = Executors.newFixedThreadPool(1);
				ObservationReader reader = new ObservationReader(servicesHost !=null ? servicesHost : this.brokerServiceAddr.getHostAddress()+ ":" + this.brokerPort, this.brokerTopics, this.internalQueue);
				executorService.execute(reader);
				logger.info("Observation reader setup... done.");
				
				ExecutorService executor = Executors.newFixedThreadPool(1);
				
				int threadCounter = 0;
				while (threadCounter < NUM_WRITER_THREADS) {
					threadCounter++;
					// Adding threads one by one
					logger.info("Starting pres-timestamp-filter thread : " + threadCounter);
					executor.execute(new ObservationFilter(redisClient,this.internalQueue, TimelineObserver.SYNC_CONTROLLER_WAITQUEUE));
				}
			}
			else
			{
				logger.warning("Error discovering Redis db endpoint.");
			}	
			
		}, exec);
		
		startFuture.join();
			
		} catch (Exception e) {
			logger.warning(e.getMessage());
		}

		

	}
	
	// ---------------------------------------------------------------------------------------------------
	
	void stop() {
		
	}
	
	// ---------------------------------------------------------------------------------------------------
	
	
}
