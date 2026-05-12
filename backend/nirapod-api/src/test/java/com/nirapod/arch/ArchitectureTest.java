package com.nirapod.arch;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.nirapod");
    }

    @Test
    void controllers_shouldNotAccessRepositoriesDirectly() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..controller..")
                .should().accessClassesThat().resideInAPackage("..repository..");

        rule.check(classes);
    }

    @Test
    void services_shouldNotDependOnControllers() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..service..")
                .should().dependOnClassesThat().resideInAPackage("..controller..");

        rule.check(classes);
    }

    @Test
    void repositories_shouldNotDependOnServices() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..repository..")
                .should().dependOnClassesThat().resideInAPackage("..service..");

        rule.check(classes);
    }

    @Test
    void models_shouldNotDependOnServices() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..model..")
                .should().dependOnClassesThat().resideInAPackage("..service..");

        rule.check(classes);
    }

    @Test
    void models_shouldNotDependOnControllers() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..model..")
                .should().dependOnClassesThat().resideInAPackage("..controller..");

        rule.check(classes);
    }
}
