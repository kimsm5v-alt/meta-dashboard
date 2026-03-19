package com.vs.meta.common.aop;

import lombok.RequiredArgsConstructor;
import org.springframework.aop.Advisor;
import org.springframework.aop.aspectj.AspectJExpressionPointcut;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.interceptor.DefaultTransactionAttribute;
import org.springframework.transaction.interceptor.RollbackRuleAttribute;
import org.springframework.transaction.interceptor.RuleBasedTransactionAttribute;
import org.springframework.transaction.interceptor.TransactionInterceptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

@Configuration
@EnableAspectJAutoProxy
@RequiredArgsConstructor
public class TransactionAspect {

    @Qualifier("mybatisTrManager")
    @org.springframework.context.annotation.Lazy
    private final PlatformTransactionManager transactionManager;

    @Bean
    public TransactionInterceptor transactionAdvice() {
        TransactionInterceptor txAdvice = new TransactionInterceptor();

        List<RollbackRuleAttribute> rollbackRules = new ArrayList<>();
        rollbackRules.add(new RollbackRuleAttribute(Exception.class));

        DefaultTransactionAttribute attribute = new RuleBasedTransactionAttribute(TransactionDefinition.PROPAGATION_REQUIRED, rollbackRules);
        String transactionAttributesDefinition = attribute.toString();

        Properties txAttributes = new Properties();
        txAttributes.setProperty("insert*", transactionAttributesDefinition);
        txAttributes.setProperty("add*", transactionAttributesDefinition);
        txAttributes.setProperty("create*", transactionAttributesDefinition);
        txAttributes.setProperty("modify*", transactionAttributesDefinition);
        txAttributes.setProperty("update*", transactionAttributesDefinition);
        txAttributes.setProperty("delete*", transactionAttributesDefinition);
        txAttributes.setProperty("remove*", transactionAttributesDefinition);
        txAttributes.setProperty("save*", transactionAttributesDefinition);
        txAttributes.setProperty("join*", transactionAttributesDefinition);
        txAttributes.setProperty("leave*", transactionAttributesDefinition);
        txAttributes.setProperty("convert*", transactionAttributesDefinition);
        txAttributes.setProperty("sync*", transactionAttributesDefinition);

        txAdvice.setTransactionAttributes(txAttributes);
        txAdvice.setTransactionManager(transactionManager);
        return txAdvice;
    }

    @Bean
    public Advisor transactionAdvisor() {
        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
        pointcut.setExpression("execution(* com.vs.meta.api..service..*(..))");
        return new DefaultPointcutAdvisor(pointcut, transactionAdvice());
    }
}
