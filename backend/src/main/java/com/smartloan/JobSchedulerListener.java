package com.smartloan;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@WebListener
public class JobSchedulerListener implements ServletContextListener {

    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println("[SCHEDULER] Starting background job scheduler...");
        scheduler = Executors.newSingleThreadScheduledExecutor();
        
        // Schedule NotificationJob to run immediately, then every 1 hour
        scheduler.scheduleAtFixedRate(new NotificationJob(), 0, 1, TimeUnit.HOURS);
        System.out.println("[SCHEDULER] NotificationJob scheduled successfully.");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        System.out.println("[SCHEDULER] Shutting down background job scheduler...");
        if (scheduler != null) {
            scheduler.shutdownNow();
        }
    }
}
