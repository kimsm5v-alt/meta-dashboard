package com.vs.meta.common.config;

import com.vs.meta.domain.GroupMember;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;
import java.util.LinkedHashMap;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MyBatis 매퍼 XML 파싱 검증 (DB 불필요).
 *
 * <p>{@link MyBatisConfig} 와 동일한 설정으로 SqlSessionFactory 를 빌드한다.
 * SqlSessionFactoryBean.getObject() 는 커넥션을 열지 않고 classpath 의 모든 매퍼 XML 을
 * 파싱하므로, 운영 기동 시점의 매퍼 파싱을 로컬 DB 없이 그대로 재현한다.
 * 매퍼 하나라도 XML/statement 가 깨지면 여기서 예외로 실패한다.
 */
class MapperXmlParseTest {

    private static final String INSERT_GROUP_MEMBER =
            "com.vs.meta.api.group.mapper.GroupMemberMapper.insertGroupMember";

    private SqlSessionFactory buildFactoryLikeProduction() throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        // 파싱 단계에서는 커넥션을 열지 않는다 — mock 으로 충분.
        factoryBean.setDataSource(Mockito.mock(DataSource.class));
        factoryBean.setMapperLocations(
                new PathMatchingResourcePatternResolver().getResources("classpath:mapper/**/*.xml"));

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.getTypeAliasRegistry().registerAlias("pagingParam", com.vs.meta.common.utils.PagingParam.class);
        configuration.getTypeAliasRegistry().registerAlias("camelHashMap", LinkedHashMap.class);
        factoryBean.setConfiguration(configuration);

        return factoryBean.getObject();
    }

    @Test
    @DisplayName("모든 매퍼 XML 이 MyBatis 파싱에 성공한다 (운영 기동 재현)")
    void allMapperXmlParses() throws Exception {
        SqlSessionFactory factory = buildFactoryLikeProduction();
        // 빌드가 예외 없이 끝났고 통계상 매핑이 등록됐으면 전 매퍼 파싱 성공.
        assertThat(factory).isNotNull();
        assertThat(factory.getConfiguration().getMappedStatementNames()).isNotEmpty();
    }

    @Test
    @DisplayName("insertGroupMember 에 ON DUPLICATE KEY UPDATE 멱등 절이 반영돼 있다")
    void insertGroupMemberIsIdempotent() throws Exception {
        SqlSessionFactory factory = buildFactoryLikeProduction();

        MappedStatement ms = factory.getConfiguration().getMappedStatement(INSERT_GROUP_MEMBER);
        String sql = ms.getBoundSql(new GroupMember()).getSql().toUpperCase(Locale.ROOT);

        assertThat(sql).contains("INSERT INTO GROUP_MEMBER");
        assertThat(sql).contains("ON DUPLICATE KEY UPDATE");
    }
}
